package com.cinema.cenimabackend.util;

import java.text.Normalizer;
import java.util.Locale;
import java.util.regex.Pattern;

public final class SlugUtils {

    private static final Pattern NON_ASCII = Pattern.compile("[^\\w-]");
    private static final Pattern MULTI_DASH = Pattern.compile("-+");

    private SlugUtils() {}

    public static String toSlug(String input) {
        String normalized = Normalizer.normalize(input, Normalizer.Form.NFD)
                .replaceAll("\\p{InCombiningDiacriticalMarks}+", "");

        return NON_ASCII.matcher(
                        normalized.toLowerCase(Locale.ROOT).trim().replace(" ", "-"))
                .replaceAll("-")
                .transform(s -> MULTI_DASH.matcher(s).replaceAll("-"))
                .replaceAll("^-|-$", "");
    }
}
