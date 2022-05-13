const fetch = (...args) =>
  import("node-fetch").then(({ default: fetch }) => fetch(...args));

class TokenRefresh {
  constructor(username, password) {
    this.username = username;
    this.password = password;
  }

  async refreshToken() {
    let token;

    const body = { login: this.username, password: this.password };
    fetch(`https://capi-v2.sankakucomplex.com/auth/token`, {
      method: "POST",
      body: JSON.stringify(body),
      headers: {
        "Content-Type": "application/json",
        "Accept": "application/json",
      },
    })
      .then((res) => res.json())
      .then((json) => {
        token = json.access_token;
      });

    return token;
  }
}

module.exports = TokenRefresh;
