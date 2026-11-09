package it.nomicosecitta.console;

import android.content.Context;
import android.util.Log;

import java.io.File;
import java.io.FileOutputStream;
import java.io.IOException;
import java.io.PrintWriter;
import java.io.RandomAccessFile;
import java.io.StringWriter;
import java.nio.charset.StandardCharsets;
import java.text.SimpleDateFormat;
import java.util.Date;
import java.util.Locale;

/**
 * Registro dell'avvio del server, letto dal pulsante Log. Ci scrivono l'app, il servizio
 * (in un altro processo) e Node stesso tramite nodebridge.cpp: tutti in coda allo stesso file.
 */
final class ServerLog {
    private static final String TAG = "NodeServer";
    private static final int MAX_READ = 96 * 1024;

    private ServerLog() {}

    static File file(Context c) {
        return new File(c.getFilesDir(), "server.log");
    }

    /** Ricomincia da capo: ogni accensione ha il suo registro. */
    static synchronized void reset(Context c) {
        file(c).delete();
    }

    static synchronized void add(Context c, String line) {
        Log.i(TAG, line);
        String time = new SimpleDateFormat("HH:mm:ss.SSS", Locale.ROOT).format(new Date());
        try (FileOutputStream out = new FileOutputStream(file(c), true)) {
            out.write((time + "  " + line + "\n").getBytes(StandardCharsets.UTF_8));
        } catch (IOException ignored) {
            // Il registro non deve mai fermare il server.
        }
    }

    static void add(Context c, String what, Throwable t) {
        StringWriter trace = new StringWriter();
        t.printStackTrace(new PrintWriter(trace));
        add(c, what + ": " + trace);
    }

    /** Le ultime righe del registro (fino a ~96 KB). */
    static String read(Context c) {
        File f = file(c);
        if (!f.exists()) return "";
        try (RandomAccessFile raf = new RandomAccessFile(f, "r")) {
            long start = Math.max(0, raf.length() - MAX_READ);
            byte[] buf = new byte[(int) (raf.length() - start)];
            raf.seek(start);
            raf.readFully(buf);
            return new String(buf, StandardCharsets.UTF_8);
        } catch (IOException e) {
            return "Non riesco a leggere il registro: " + e;
        }
    }
}
