const analytics = firebase.analytics();

let generationForm = new Vue({
  el: "#generation-form",
  data: {
    maxViewsSelected: true,
    maxDaysSelected: true,
    maxViews: 3,
    maxDays: 2,
    password: "",
    secret: "",
    secretInputType: "password",
    secretInputButton: "fa-eye",
    isProtected: false,
    disabled: false,
    link: "",
    errors: clearErrors()
  },
  methods: {
    onPasswordChange: async function() {
      this.password ? (this.isProtected = true) : (this.isProtected = false);
      await this.$nextTick();
    },
    hideReveal,
    submit: async function() {
      this.errors = clearErrors();
      if (!this.secret) {
        this.errors.secret = true;
      }
      if (this.maxDaysSelected && (this.maxDays < 1 || this.maxDays > 30)) {
        this.errors.maxDays = true;
      }
      if (this.maxViewsSelected && this.maxViews < 1) {
        this.errors.maxViews = true;
      }
      if (this.isProtected && !this.password) {
        this.errors.password = true;
      }

      if (Object.values(this.errors).some(val => val)) {
        return;
      }

      this.disabled = true;

      if (this.isProtected) {
        secret = sjcl.encrypt(this.password, this.secret);
      } else {
        secret = this.secret;
      }

      let response = await axios.post("/secret", {
        maxDays: this.maxDaysSelected ? this.maxDays : 30,
        maxViews: this.maxViewsSelected ? this.maxViews : undefined,
        secret,
        isProtected: this.isProtected
      });
      this.link = window.location.origin + response.data.link;
      firebase.analytics().logEvent("secret_submitted");
    }
  }
});
function clearErrors() {
  return {
    secret: false,
    maxDays: false,
    maxViews: false,
    password: false
  };
}
