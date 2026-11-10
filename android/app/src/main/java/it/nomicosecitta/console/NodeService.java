package it.nomicosecitta.console;

import android.app.Notification;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.app.Service;
import android.content.Context;
import android.content.Intent;
import android.content.pm.ServiceInfo;
import android.net.wifi.WifiManager;
import android.os.Build;
import android.os.IBinder;
import android.os.PowerManager;
import android.os.Process;
import android.system.Os;

import java.io.BufferedInputStream;
import java.io.File;
import java.io.FileOutputStream;
import java.io.IOException;
import java.io.OutputStream;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.util.zip.ZipEntry;
import java.util.zip.ZipInputStream;

/**
 * Tiene acceso il server Node.js in primo piano, con notifica fissa.
 * Gira in un processo a parte (":node") perché Node si può avviare una volta sola per processo:
 * per spegnerlo si chiude il processo, e la volta dopo ne parte uno nuovo.
 */
public class NodeService extends Service {
    static final String EXTRA_URL = "url";
    static final String ACTION_STOP = "it.nomicosecitta.console.STOP";
    private static final String CHANNEL = "server";
    private static final int NOTIFICATION_ID = 1;

    private static native int startNode(String[] args, String logPath);

    private static boolean started;
    private PowerManager.WakeLock wakeLock;
    private WifiManager.WifiLock wifiLock;
    private WifiManager.MulticastLock multicastLock;

    @Override
    public void onCreate() {
        super.onCreate();
        Thread.UncaughtExceptionHandler fallback = Thread.getDefaultUncaughtExceptionHandler();
        Thread.setDefaultUncaughtExceptionHandler((thread, error) -> {
            ServerLog.add(this, "Errore nel servizio (" + thread.getName() + ")", error);
            if (fallback != null) fallback.uncaughtException(thread, error);
        });
        ServerLog.add(this, "Servizio creato (processo " + Process.myPid() + ")");
    }

    @Override
    public int onStartCommand(Intent intent, int flags, int startId) {
        if (intent != null && ACTION_STOP.equals(intent.getAction())) {
            ServerLog.add(this, "Spegnimento richiesto");
            shutdown();
            return START_NOT_STICKY;
        }
        String url = intent != null ? intent.getStringExtra(EXTRA_URL) : null;
        if (url == null) url = Net.LOCAL;

        try {
            Notification notification = buildNotification();
            if (Build.VERSION.SDK_INT >= 34) {
                startForeground(NOTIFICATION_ID, notification, ServiceInfo.FOREGROUND_SERVICE_TYPE_SPECIAL_USE);
            } else {
                startForeground(NOTIFICATION_ID, notification);
            }
            ServerLog.add(this, "Servizio in primo piano");
        } catch (Throwable t) {
            ServerLog.add(this, "Non riesco a mettere il servizio in primo piano", t);
        }

        if (!started) {
            started = true;
            acquireLocks();
            final String publicUrl = url;
            // Stack ampio: quello predefinito dei thread Java (~1 MB) è al limite per V8.
            new Thread(null, () -> runNode(publicUrl), "node", 8L * 1024 * 1024).start();
        }
        return START_REDELIVER_INTENT;
    }

    private void runNode(String publicUrl) {
        try {
            String libDir = getApplicationInfo().nativeLibraryDir;
            String[] libs = new File(libDir).list();
            ServerLog.add(this, "Librerie in " + libDir + ": " + (libs == null ? "nessuna" : String.join(", ", libs)));
            System.loadLibrary("node");
            System.loadLibrary("nodebridge");
            ServerLog.add(this, "Librerie native caricate");

            long t0 = System.currentTimeMillis();
            File project = extractProject(this);
            ServerLog.add(this, "Server pronto in " + project + " (" + (System.currentTimeMillis() - t0) + " ms)");
            Os.setenv("PUBLIC_URL", publicUrl, true);
            Os.setenv("PORT", String.valueOf(Net.PORT), true);
            Os.setenv("HOME", getFilesDir().getAbsolutePath(), true);
            Os.setenv("TMPDIR", getCacheDir().getAbsolutePath(), true);
            Os.setenv("NODE_ENV", "production", true);
            ServerLog.add(this, "Avvio Node");
            int code = startNode(new String[] {"node", new File(project, "boot.mjs").getAbsolutePath()},
                    ServerLog.file(this).getAbsolutePath());
            ServerLog.add(this, "Node è uscito con codice " + code);
        } catch (Throwable t) {
            ServerLog.add(this, "Il server non è partito", t);
        }
        shutdown();
    }

    /** Spegne tutto: il processo ":node" muore e la porta si libera. */
    private void shutdown() {
        releaseLocks();
        stopForeground(STOP_FOREGROUND_REMOVE);
        stopSelf();
        Process.killProcess(Process.myPid());
    }

    private void acquireLocks() {
        PowerManager pm = (PowerManager) getSystemService(Context.POWER_SERVICE);
        wakeLock = pm.newWakeLock(PowerManager.PARTIAL_WAKE_LOCK, "giochi:server");
        wakeLock.acquire();
        // Senza questo il Wi-Fi a schermo spento va in risparmio e i telefoni sentono ritardi.
        WifiManager wifi = (WifiManager) getApplicationContext().getSystemService(Context.WIFI_SERVICE);
        if (wifi != null) {
            int mode = Build.VERSION.SDK_INT >= 29 ? WifiManager.WIFI_MODE_FULL_LOW_LATENCY : WifiManager.WIFI_MODE_FULL_HIGH_PERF;
            wifiLock = wifi.createWifiLock(mode, "giochi:server");
            wifiLock.acquire();
            // Senza questo il Wi-Fi scarta le richieste per game.local (mDNS).
            multicastLock = wifi.createMulticastLock("giochi:mdns");
            multicastLock.acquire();
        }
    }

    private void releaseLocks() {
        if (wakeLock != null && wakeLock.isHeld()) wakeLock.release();
        if (wifiLock != null && wifiLock.isHeld()) wifiLock.release();
        if (multicastLock != null && multicastLock.isHeld()) multicastLock.release();
    }

    private Notification buildNotification() {
        NotificationManager nm = getSystemService(NotificationManager.class);
        if (Build.VERSION.SDK_INT >= 26 && nm.getNotificationChannel(CHANNEL) == null) {
            NotificationChannel channel = new NotificationChannel(CHANNEL, getString(R.string.channel_name), NotificationManager.IMPORTANCE_LOW);
            channel.setShowBadge(false);
            nm.createNotificationChannel(channel);
        }
        PendingIntent open = PendingIntent.getActivity(this, 0,
                new Intent(this, MainActivity.class), PendingIntent.FLAG_IMMUTABLE);
        PendingIntent stop = PendingIntent.getService(this, 1,
                new Intent(this, NodeService.class).setAction(ACTION_STOP), PendingIntent.FLAG_IMMUTABLE);

        Notification.Builder b = Build.VERSION.SDK_INT >= 26 ? new Notification.Builder(this, CHANNEL) : new Notification.Builder(this);
        return b.setSmallIcon(R.drawable.ic_stat)
                .setContentTitle(getString(R.string.notification_title))
                .setContentText(Net.DISPLAY)
                .setContentIntent(open)
                .setOngoing(true)
                .addAction(new Notification.Action.Builder(null, getString(R.string.stop), stop).build())
                .build();
    }

    /** Scompatta il server dagli asset alla prima apertura dopo ogni installazione o aggiornamento. */
    static File extractProject(Context c) throws Exception {
        File files = c.getFilesDir();
        File dir = new File(files, "nodejs-project");
        File marker = new File(files, "nodejs-project.stamp");
        String stamp = String.valueOf(c.getPackageManager().getPackageInfo(c.getPackageName(), 0).lastUpdateTime);
        if (dir.isDirectory() && marker.exists()
                && stamp.equals(new String(Files.readAllBytes(marker.toPath()), StandardCharsets.UTF_8))) {
            ServerLog.add(c, "Server già scompattato, lo riuso");
            return dir;
        }
        ServerLog.add(c, "Scompatto il server dall'APK…");

        deleteRecursively(dir);
        String base = files.getCanonicalPath() + File.separator;
        byte[] buf = new byte[64 * 1024];
        try (ZipInputStream zip = new ZipInputStream(new BufferedInputStream(c.getAssets().open("nodejs-project.zip")))) {
            ZipEntry entry;
            while ((entry = zip.getNextEntry()) != null) {
                File f = new File(files, entry.getName());
                if (!f.getCanonicalPath().startsWith(base)) throw new IOException("Percorso non valido: " + entry.getName());
                if (entry.isDirectory()) {
                    f.mkdirs();
                    continue;
                }
                f.getParentFile().mkdirs();
                try (OutputStream out = new FileOutputStream(f)) {
                    int n;
                    while ((n = zip.read(buf)) > 0) out.write(buf, 0, n);
                }
            }
        }
        Files.write(marker.toPath(), stamp.getBytes(StandardCharsets.UTF_8));
        return dir;
    }

    private static void deleteRecursively(File f) {
        File[] children = f.listFiles();
        if (children != null) for (File child : children) deleteRecursively(child);
        f.delete();
    }

    @Override
    public IBinder onBind(Intent intent) {
        return null;
    }
}
