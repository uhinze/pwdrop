let retrievePw = new Vue({
  el: "#retrieve-pw",
  data: {
    id: "",
    secret: "",
    secretInputType: "password",
    secretInputButton: "fa-eye",
    found: true,
    isProtected: false,
    password: "",
    protectedSecret: "",
    errors: clearErrors()
  },
  methods: {
    hideReveal,
    decrypt: function() {
      this.errors = clearErrors();

      try {
        this.secret = sjcl.decrypt(this.password, this.protectedSecret);
      } catch {
        this.errors.password = true;
      }
    }
  },
  async beforeMount() {
    let uri = window.location.search.substring(1);
    let params = new URLSearchParams(uri);
    this.id = params.get("id");
    try {
      let response = await axios.get("/secret", {
        params: { id: this.id }
      });
      this.isProtected = response.data.isProtected;
      if (!this.isProtected) {
        this.secret = response.data.secret;
      } else {
        this.protectedSecret = response.data.secret;
      }
    } catch {
      this.found = false;
    }
  }
});

function clearErrors() {
  return {
    password: false
  };
}
