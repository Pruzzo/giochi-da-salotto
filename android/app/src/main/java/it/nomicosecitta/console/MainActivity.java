package it.nomicosecitta.console;

import android.Manifest;
import android.app.Activity;
import android.app.UiModeManager;
import android.content.ClipData;
import android.content.ClipboardManager;
import android.content.Intent;
import android.content.pm.PackageManager;
import android.content.res.Configuration;
import android.graphics.Insets;
import android.os.Build;
import android.os.Bundle;
import android.os.Handler;
import android.os.Looper;
import android.os.SystemClock;
import android.view.View;
import android.view.WindowInsets;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import android.widget.Button;
import android.widget.ScrollView;
import android.widget.TextView;
import android.widget.Toast;

import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;

/**
 * Accende e spegne il server, mostra l'indirizzo e, a server acceso, la console
 * (o lo schermo della TV, se l'app gira su un televisore).
 */
public class MainActivity extends Activity {
    private enum State { STOPPED, STARTING, UP, STOPPING }

    private static final long START_TIMEOUT_MS = 30_000;

    private final Handler main = new Handler(Looper.getMainLooper());
    private final ExecutorService io = Executors.newSingleThreadExecutor();
    private final Runnable poll = this::poll;
    private final Runnable refreshLog = this::refreshLog;

    private WebView web;
    private TextView status;
    private TextView placeholder;
    private Button toggle;
    private Button share;
    private View logPanel;
    private ScrollView logScroll;
    private TextView logText;

    private State state = State.STOPPED;
    private String url;
    private String error;
    private long startDeadline;
    private boolean isTv;
    private boolean autoStart;
    private boolean resumed;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_main);
        web = findViewById(R.id.web);
        status = findViewById(R.id.status);
        placeholder = findViewById(R.id.placeholder);
        toggle = findViewById(R.id.toggle);
        share = findViewById(R.id.share);
        logPanel = findViewById(R.id.log_panel);
        logScroll = findViewById(R.id.log_scroll);
        logText = findViewById(R.id.log_text);

        UiModeManager ui = (UiModeManager) getSystemService(UI_MODE_SERVICE);
        isTv = ui != null && ui.getCurrentModeType() == Configuration.UI_MODE_TYPE_TELEVISION;
        autoStart = savedInstanceState == null;

        applyInsets();
        setupWebView();

        toggle.setOnClickListener(v -> {
            if (state == State.UP || state == State.STARTING) stop();
            else if (state == State.STOPPED) start();
        });
        share.setOnClickListener(v -> shareUrl());
        findViewById(R.id.logs).setOnClickListener(v -> showLog(logPanel.getVisibility() != View.VISIBLE));
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
        else if (web.canGoBack()) web.goBack();
        else super.onBackPressed();
    }

    private void start() {
        ServerLog.reset(this);
        ServerLog.add(this, "Giochi da salotto " + BuildConfig.VERSION_NAME + " su Android " + Build.VERSION.RELEASE
                + " (API " + Build.VERSION.SDK_INT + "), " + Build.MANUFACTURER + " " + Build.MODEL
                + ", ABI " + String.join("/", Build.SUPPORTED_ABIS) + (isTv ? ", TV" : ""));
        ServerLog.add(this, "Interfacce di rete:" + Net.describeInterfaces());
        String ip = Net.lanAddress();
        ServerLog.add(this, "Indirizzo scelto: " + (ip == null ? "nessuno" : ip));
        if (ip == null) {
            error = getString(R.string.no_network);
            render();
            return;
        }
        error = null;
        url = Net.joinUrl(ip);
        Intent intent = new Intent(this, NodeService.class).putExtra(NodeService.EXTRA_URL, url);
        if (Build.VERSION.SDK_INT >= 26) startForegroundService(intent);
        else startService(intent);
        state = State.STARTING;
        startDeadline = SystemClock.elapsedRealtime() + START_TIMEOUT_MS;
        render();
    }

    private void stop() {
        startService(new Intent(this, NodeService.class).setAction(NodeService.ACTION_STOP));
        state = State.STOPPING;
        web.loadUrl("about:blank");
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
            if (state == State.STARTING) ServerLog.add(this, "Il server risponde su " + Net.LOCAL);
            state = State.UP;
            error = null;
            if (url == null) {
                String ip = Net.lanAddress();
                url = ip != null ? Net.joinUrl(ip) : Net.LOCAL;
            }
            web.loadUrl(Net.LOCAL + (isTv ? "/tv" : "/console"));
        } else if (!up && state == State.UP) {
            state = State.STOPPED;
            web.loadUrl("about:blank");
        } else if (!up && state == State.STOPPING) {
            state = State.STOPPED;
        } else if (!up && state == State.STARTING && SystemClock.elapsedRealtime() > startDeadline) {
            state = State.STOPPED;
            error = getString(R.string.start_failed);
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
            case UP: status.setText(getString(R.string.status_up, url)); break;
            case STARTING: status.setText(R.string.status_starting); break;
            case STOPPING: status.setText(R.string.status_stopping); break;
            default: status.setText(R.string.status_stopped);
        }
        toggle.setText(up || state == State.STARTING ? R.string.stop : R.string.start);
        toggle.setEnabled(state != State.STOPPING);
        share.setVisibility(up ? View.VISIBLE : View.GONE);
        web.setVisibility(up ? View.VISIBLE : View.INVISIBLE);
        placeholder.setVisibility(up ? View.GONE : View.VISIBLE);
        if (error != null) placeholder.setText(error);
        else if (state == State.STARTING) placeholder.setText(R.string.placeholder_starting);
        else placeholder.setText(R.string.placeholder_stopped);
        // Su una TV lo schermo non deve spegnersi né passare al salvaschermo durante la partita.
        web.setKeepScreenOn(isTv && up);
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
        if (url == null) return;
        Intent send = new Intent(Intent.ACTION_SEND)
                .setType("text/plain")
                .putExtra(Intent.EXTRA_TEXT, getString(R.string.share_text, url, url + "/tv"));
        startActivity(Intent.createChooser(send, getString(R.string.share)));
    }

    private void setupWebView() {
        WebSettings s = web.getSettings();
        s.setJavaScriptEnabled(true);
        s.setDomStorageEnabled(true);
        s.setMediaPlaybackRequiresUserGesture(false);
        web.setWebViewClient(new WebViewClient());
    }

    /** Da Android 15 l'app disegna sotto le barre di sistema: la barra rossa scende sotto l'orologio. */
    private void applyInsets() {
        View root = findViewById(R.id.root);
        View header = findViewById(R.id.header);
        int headerTop = header.getPaddingTop();
        root.setOnApplyWindowInsetsListener((v, insets) -> {
            int left, top, right, bottom;
            if (Build.VERSION.SDK_INT >= 30) {
                Insets bars = insets.getInsets(WindowInsets.Type.systemBars() | WindowInsets.Type.displayCutout());
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
