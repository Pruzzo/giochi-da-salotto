package it.nomicosecitta.console;

import java.net.HttpURLConnection;
import java.net.Inet4Address;
import java.net.InetAddress;
import java.net.NetworkInterface;
import java.net.URL;
import java.util.Collections;

/** Rete locale: l'indirizzo che telefoni e TV possono raggiungere, e se il server risponde. */
final class Net {
    static final int PORT = 3000;
    static final String LOCAL = "http://127.0.0.1:" + PORT;

    private Net() {}

    /**
     * L'IPv4 privato del Wi-Fi o del cavo, altrimenti quello dell'hotspot.
     * Null se il dispositivo non è su nessuna rete locale (solo dati mobili, o niente).
     */
    static String lanAddress() {
        String best = null;
        int bestRank = Integer.MAX_VALUE;
        try {
            for (NetworkInterface ni : Collections.list(NetworkInterface.getNetworkInterfaces())) {
                if (!ni.isUp() || ni.isLoopback()) continue;
                int rank = rank(ni.getName());
                if (rank < 0 || rank >= bestRank) continue;
                for (InetAddress a : Collections.list(ni.getInetAddresses())) {
                    if (a instanceof Inet4Address && a.isSiteLocalAddress()) {
                        best = a.getHostAddress();
                        bestRank = rank;
                        break;
                    }
                }
            }
        } catch (Exception ignored) {
            // Nessuna interfaccia leggibile: resta null.
        }
        return best;
    }

    /** 0 Wi-Fi o cavo, 1 hotspot, 2 altro; -1 da scartare (dati mobili, VPN). */
    private static int rank(String name) {
        if (name.matches("^(rmnet|ccmni|tun|ppp|dummy|p2p|v4-|ifb|sit|ip6|ip_vti|clat).*")) return -1;
        if (name.equals("wlan0") || name.startsWith("eth")) return 0;
        if (name.startsWith("wlan") || name.startsWith("ap") || name.startsWith("swlan") || name.startsWith("softap")) return 1;
        return 2;
    }

    static String joinUrl(String ip) {
        return "http://" + ip + ":" + PORT;
    }

    /** Il server risponde su questo dispositivo? Da chiamare fuori dal thread principale. */
    static boolean isUp() {
        HttpURLConnection conn = null;
        try {
            conn = (HttpURLConnection) new URL(LOCAL + "/qr.svg").openConnection();
            conn.setConnectTimeout(700);
            conn.setReadTimeout(700);
            return conn.getResponseCode() == 200;
        } catch (Exception e) {
            return false;
        } finally {
            if (conn != null) conn.disconnect();
        }
    }
}
