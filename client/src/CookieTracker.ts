export class CookieTracker {
    /**
     * Creates or updates a cookie.
     * @param cookieName The name of the cookie.
     * @param cookieValue The value to be assigned to the cookie.
     */
    public setCookie(cookieName: string, cookieValue: string) {
        const expirationDate = new Date();
        expirationDate.setDate(expirationDate.getDate() + 1);

        document.cookie = `${cookieName}=${cookieValue};expires=${expirationDate.toUTCString()};path=/;`;
    }

    /**
     * Attempts to get the cookie with the given name from a potential list of cookies.
     * @param cookieName The name of the cookie.
     * @returns The value of the cookie. Or an empty string if the cookie was not found.
     */
    public getCookie(cookieName: string) {
        const name = cookieName + "=";
        const ca = document.cookie.split(";");
        for (let i = 0; i < ca.length; i++) {
            let cookie = ca[i];
            while (cookie.charAt(0) == " ") {
                cookie = cookie.substring(1);
            }
            if (cookie.indexOf(name) == 0) {
                return cookie.substring(name.length, cookie.length);
            }
        }

        // Cookie not found. Return blank.
        return "";
    }

    /**
     * Deletes the cookie.
     * @param cookieName The name of the cookie.
     */
    public deleteCookie(cookieName: string) {
        if (this.getCookie(cookieName)) {
            document.cookie = `${cookieName}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`;
        }
    }
}
