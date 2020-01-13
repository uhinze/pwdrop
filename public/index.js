let generationForm = new Vue({
  el: "#generation-form",
  data: {
    maxViewsSelected: true,
    maxDaysSelected: true,
    maxViews: 3,
    maxDays: 2,
    password: "",
    secret: "",
    isProtected: false
  },
  methods: {
    onPasswordChange: async function() {
      this.password ? (this.isProtected = true) : (this.isProtected = false);
      await this.$nextTick();
    },
    submit: async function() {
      let ttl;
      if (this.maxDaysSelected) {
        ttl = new Date() + this.maxDays;
      } else {
        ttl = new Date() + 30;
      }

      await axios.post("/secret", {
        ttl,
        maxViews: this.maxViewsSelected ? this.maxViews : undefined,
        secret: this.secret,
        isProtected: this.isProtected
      });
    }
  }
});
