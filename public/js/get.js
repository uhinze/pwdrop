const analytics = firebase.analytics();
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
    errors: clearErrors(),
    copied: false
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
    },
    copy: function() {
      var textArea = document.createElement("textarea");
      textArea.value = this.secret;
      textArea.style.position = "fixed"; //avoid scrolling to bottom
      document.body.appendChild(textArea);
      textArea.focus();
      textArea.select();

      try {
        document.execCommand("copy");
        this.copied = true;
      } catch (err) {
        console.error("Copy failed: ", err);
      }

      document.body.removeChild(textArea);
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
      firebase.analytics().logEvent("secret_retrieved");
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
