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
    link: ""
  },
  methods: {
    onPasswordChange: async function() {
      this.password ? (this.isProtected = true) : (this.isProtected = false);
      await this.$nextTick();
    },
    hideReveal,
    submit: async function() {
      this.disabled = true;
      await this.$nextTick();

      let response = await axios.post("/secret", {
        maxDays: this.maxDaysSelected ? this.maxDays : 30,
        maxViews: this.maxViewsSelected ? this.maxViews : undefined,
        secret: this.secret,
        isProtected: this.isProtected
      });
      this.link = window.location.origin + response.data.link;
    }
  }
});
