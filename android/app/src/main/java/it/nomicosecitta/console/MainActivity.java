package it.nomicosecitta.console;

import android.Manifest;
import android.app.Activity;
import android.app.UiModeManager;
import android.content.ClipData;
import android.content.ClipboardManager;
import android.content.Intent;
import android.content.pm.PackageManager;
import android.content.res.ColorStateList;
import android.content.res.Configuration;
import android.graphics.Insets;
import android.graphics.Typeface;
import android.net.Uri;
import android.os.Build;
import android.os.Bundle;
import android.os.Handler;
import android.os.Looper;
import android.os.SystemClock;
import android.view.Menu;
import android.view.View;
import android.view.WindowInsets;
import android.webkit.WebResourceRequest;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import android.widget.Button;
import android.widget.PopupMenu;
import android.widget.ScrollView;
import android.widget.TextView;
import android.widget.Toast;

import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;

/**
 * Accende e spegne il server, mostra l'indirizzo e, a server acceso, la console
 * (o lo schermo della TV, se l'app gira su un televisore).
 * A server spento la pagina è assets/shell/index.html: stessi materiali del gioco,
 * e i suoi bottoni tornano qui con indirizzi salotto://.
 */
public class MainActivity extends Activity {
    private enum State { STOPPED, STARTING, UP, STOPPING }

    private static final long START_TIMEOUT_MS = 30_000;
    private static final String SHELL = "file:///android_asset/shell/index.html";
    private static final int MENU_SHARE = 1, MENU_LOG = 2, MENU_TOGGLE = 3;

    private final Handler main = new Handler(Looper.getMainLooper());
    private final ExecutorService io = Executors.newSingleThreadExecutor();
    private final Runnable poll = this::poll;
    private final Runnable refreshLog = this::refreshLog;

    private WebView web;
    private TextView status;
    private View dot;
    private Button home;
    private String shellState;
    private View logPanel;
    private ScrollView logScroll;
    private TextView logText;

    private State state = State.STOPPED;
    /** Perché il server non è acceso: "no_network", "failed" o null. */
    private String error;
    private long startDeadline;
    private boolean isTv;
    private boolean autoStart;
    private boolean resumed;
    private boolean onHome;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_main);
        web = findViewById(R.id.web);
        status = findViewById(R.id.status);
        dot = findViewById(R.id.dot);
        home = findViewById(R.id.home);
        logPanel = findViewById(R.id.log_panel);
        logScroll = findViewById(R.id.log_scroll);
        logText = findViewById(R.id.log_text);

        UiModeManager ui = (UiModeManager) getSystemService(UI_MODE_SERVICE);
        isTv = ui != null && ui.getCurrentModeType() == Configuration.UI_MODE_TYPE_TELEVISION;
        autoStart = savedInstanceState == null;

        applyInsets();
        setupWebView();

        // Il carattere del nastro Dymo, lo stesso del gioco.
        Typeface elite = Typeface.createFromAsset(getAssets(), "fonts/special_elite.ttf");
        for (int id : new int[] {R.id.status, R.id.home, R.id.log_title, R.id.log_copy, R.id.log_close}) {
            ((TextView) findViewById(id)).setTypeface(elite);
        }

        home.setOnClickListener(v -> web.loadUrl(Net.LOCAL + "/console"));
        findViewById(R.id.menu).setOnClickListener(this::showMenu);
        findViewById(R.id.log_close).setOnClickListener(v -> showLog(false));
        findViewById(R.id.log_copy).setOnClickListener(v -> copyLog());

        if (Build.VERSION.SDK_INT >= 33
                && checkSelfPermission(Manifest.permission.POST_NOTIFICATIONS) != PackageManager.PERMISSION_GRANTED) {
            requestPermissions(new String[] {Manifest.permission.POST_NOTIFICATIONS}, 1);
        }
        render();
    }

    @Override
    protected void onResume() {
        super.onResume();
        resumed = true;
        main.removeCallbacks(poll);
        poll();
        if (logPanel.getVisibility() == View.VISIBLE) refreshLog();
    }

    @Override
    protected void onPause() {
        super.onPause();
        resumed = false;
        main.removeCallbacks(poll);
        main.removeCallbacks(refreshLog);
    }

    @Override
    protected void onDestroy() {
        super.onDestroy();
        io.shutdownNow();
        web.destroy();
    }

    @Override
    public void onBackPressed() {
        if (logPanel.getVisibility() == View.VISIBLE) showLog(false);
        else if (state == State.UP && web.canGoBack() && !onHome) web.goBack(); // dalla partita si torna alla console
        else super.onBackPressed();
    }

    private void start() {
        ServerLog.reset(this);
        ServerLog.add(this, "Giochi da salotto " + BuildConfig.VERSION_NAME + " su Android " + Build.VERSION.RELEASE
                + " (API " + Build.VERSION.SDK_INT + "), " + Build.MANUFACTURER + " " + Build.MODEL
                + ", ABI " + String.join("/", Build.SUPPORTED_ABIS) + (isTv ? ", TV" : ""));
        ServerLog.add(this, "Interfacce di rete:" + Net.describeInterfaces());
        String ip = Net.lanAddress();
        ServerLog.add(this, ip == null ? "Nessuna rete locale" : "Rete locale trovata");
        if (ip == null) {
            error = "no_network";
            render();
            return;
        }
        error = null;
        Intent intent = new Intent(this, NodeService.class).putExtra(NodeService.EXTRA_URL, Net.joinUrl(ip));
        if (Build.VERSION.SDK_INT >= 26) startForegroundService(intent);
        else startService(intent);
        state = State.STARTING;
        startDeadline = SystemClock.elapsedRealtime() + START_TIMEOUT_MS;
        render();
    }

    private void stop() {
        startService(new Intent(this, NodeService.class).setAction(NodeService.ACTION_STOP));
        state = State.STOPPING;
        error = null;
        render();
    }

    /** Chiede al server se è vivo: subito dopo i cambi di stato spesso, poi ogni pochi secondi. */
    private void poll() {
        io.execute(() -> {
            boolean up = Net.isUp();
            main.post(() -> onHealth(up));
        });
    }

    private void onHealth(boolean up) {
        if (isFinishing() || isDestroyed()) return;
        if (up && state != State.UP && state != State.STOPPING) {
            if (state == State.STARTING) ServerLog.add(this, "Il server risponde");
            state = State.UP;
            error = null;
            web.loadUrl(Net.LOCAL + (isTv ? "/tv" : "/console"));
        } else if (!up && state == State.UP) {
            state = State.STOPPED;
        } else if (!up && state == State.STOPPING) {
            state = State.STOPPED;
        } else if (!up && state == State.STARTING && SystemClock.elapsedRealtime() > startDeadline) {
            state = State.STOPPED;
            error = "failed";
            ServerLog.add(this, "Il server non risponde dopo " + START_TIMEOUT_MS / 1000 + " secondi");
        } else if (!up && state == State.STOPPED && autoStart) {
            autoStart = false;
            start();
        }
        autoStart = false;
        render();
        if (resumed) main.postDelayed(poll, state == State.UP || state == State.STOPPED ? 3000 : 400);
    }

    private void render() {
        boolean up = state == State.UP;
        switch (state) {
            case UP: status.setText(getString(R.string.status_up, Net.DISPLAY)); break;
            case STARTING: status.setText(R.string.status_starting); break;
            case STOPPING: status.setText(R.string.status_stopping); break;
            default: status.setText(R.string.status_stopped);
        }
        int dotColor = up ? R.color.dot_up : state == State.STOPPED ? R.color.dot_down : R.color.dot_busy;
        dot.setBackgroundTintList(ColorStateList.valueOf(getColor(dotColor)));
        // Durante la partita la barra offre solo il ritorno alla console; su una TV non c'è console.
        home.setVisibility(up && !onHome && !isTv ? View.VISIBLE : View.GONE);
        if (!up) showShell(state == State.STARTING || autoStart ? "starting" : state == State.STOPPING ? "stopping" : error != null ? error : "stopped");
        else shellState = null;
        // Su una TV lo schermo non deve spegnersi né passare al salvaschermo durante la partita.
        web.setKeepScreenOn(isTv && up);
    }

    /** La pagina di stato dell'app: si carica una volta, poi cambia stato senza ricaricarsi. */
    private void showShell(String next) {
        if (next.equals(shellState)) return;
        boolean loaded = shellState != null;
        shellState = next;
        if (loaded) web.evaluateJavascript("window.setState && setState('" + next + "')", null);
        else web.loadUrl(SHELL + "#" + next + "," + BuildConfig.VERSION_NAME + (isTv ? ",tv" : ""));
    }

    /** Il menu della barra: quello che serve di rado sta qui, non in fila sullo schermo. */
    private void showMenu(View anchor) {
        PopupMenu menu = new PopupMenu(this, anchor);
        boolean running = state == State.UP || state == State.STARTING;
        if (state == State.UP) menu.getMenu().add(Menu.NONE, MENU_SHARE, 0, R.string.share);
        menu.getMenu().add(Menu.NONE, MENU_LOG, 1, R.string.log);
        if (state != State.STOPPING) menu.getMenu().add(Menu.NONE, MENU_TOGGLE, 2, running ? R.string.stop : R.string.start);
        menu.setOnMenuItemClickListener(item -> {
            switch (item.getItemId()) {
                case MENU_SHARE: shareUrl(); break;
                case MENU_LOG: showLog(true); break;
                default: toggle();
            }
            return true;
        });
        menu.show();
    }

    private void toggle() {
        if (state == State.UP || state == State.STARTING) stop();
        else if (state == State.STOPPED) start();
    }

    private void showLog(boolean show) {
        logPanel.setVisibility(show ? View.VISIBLE : View.GONE);
        main.removeCallbacks(refreshLog);
        if (show) refreshLog();
    }

    /** Rilegge il registro ogni secondo finché il pannello è aperto. */
    private void refreshLog() {
        io.execute(() -> {
            String text = ServerLog.read(this);
            main.post(() -> {
                if (logPanel.getVisibility() != View.VISIBLE) return;
                boolean atBottom = !logScroll.canScrollVertically(1);
                logText.setText(text.isEmpty() ? getString(R.string.log_empty) : text);
                if (atBottom) logScroll.post(() -> logScroll.fullScroll(View.FOCUS_DOWN));
                if (resumed) main.postDelayed(refreshLog, 1000);
            });
        });
    }

    private void copyLog() {
        ClipboardManager clipboard = (ClipboardManager) getSystemService(CLIPBOARD_SERVICE);
        clipboard.setPrimaryClip(ClipData.newPlainText("Log del server", logText.getText()));
        Toast.makeText(this, R.string.log_copied, Toast.LENGTH_SHORT).show();
    }

    private void shareUrl() {
        Intent send = new Intent(Intent.ACTION_SEND)
                .setType("text/plain")
                .putExtra(Intent.EXTRA_TEXT, getString(R.string.share_text, Net.DISPLAY, Net.DISPLAY + "/tv"));
        startActivity(Intent.createChooser(send, getString(R.string.share)));
    }

    private void setupWebView() {
        WebSettings s = web.getSettings();
        s.setJavaScriptEnabled(true);
        s.setDomStorageEnabled(true);
        s.setMediaPlaybackRequiresUserGesture(false);
        web.setBackgroundColor(getColor(R.color.kraft)); // niente lampo bianco tra una pagina e l'altra
        web.setWebViewClient(new WebViewClient() {
            @Override
            public void doUpdateVisitedHistory(WebView view, String page, boolean isReload) {
                boolean wasHome = onHome;
                onHome = page.endsWith(isTv ? "/tv" : "/console");
                // Arrivati alla console non si torna indietro alla pagina di stato.
                if (onHome && !wasHome && state == State.UP) view.clearHistory();
                render();
            }

            @Override
            public void onPageFinished(WebView view, String page) {
                // Se lo stato è cambiato mentre la pagina si caricava, lo riallinea.
                if (page.startsWith(SHELL) && shellState != null) view.evaluateJavascript("setState('" + shellState + "')", null);
            }

            /** I bottoni della pagina di stato: salotto://start e salotto://log. */
            @Override
            public boolean shouldOverrideUrlLoading(WebView view, WebResourceRequest request) {
                Uri uri = request.getUrl();
                if (!"salotto".equals(uri.getScheme())) return false;
                if ("log".equals(uri.getHost())) showLog(true);
                else if (state == State.STOPPED) start();
                return true;
            }
        });
    }

    /** Da Android 15 l'app disegna sotto le barre di sistema: la barra rossa scende sotto l'orologio. */
    private void applyInsets() {
        View root = findViewById(R.id.root);
        View header = findViewById(R.id.header);
        int headerTop = header.getPaddingTop();
        root.setOnApplyWindowInsetsListener((v, insets) -> {
            int left, top, right, bottom;
            if (Build.VERSION.SDK_INT >= 30) {
                Insets bars = insets.getInsets(WindowInsets.Type.systemBars() | WindowInsets.Type.displayCutout() | WindowInsets.Type.ime());
                left = bars.left; top = bars.top; right = bars.right; bottom = bars.bottom;
            } else {
                left = insets.getSystemWindowInsetLeft(); top = insets.getSystemWindowInsetTop();
                right = insets.getSystemWindowInsetRight(); bottom = insets.getSystemWindowInsetBottom();
            }
            v.setPadding(left, 0, right, bottom);
            header.setPadding(header.getPaddingLeft(), headerTop + top, header.getPaddingRight(), header.getPaddingBottom());
            return insets;
        });
    }
}
