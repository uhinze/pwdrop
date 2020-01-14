let retrievePw = new Vue({
  el: "#retrieve-pw",
  data: {
    id: "",
    secret: "",
    secretInputType: "password",
    secretInputButton: "fa-eye",
    found: true
  },
  methods: {
    hideReveal
  },
  async beforeMount() {
    let uri = window.location.search.substring(1);
    let params = new URLSearchParams(uri);
    this.id = params.get("id");
    try {
      let response = await axios.get("/secret", {
        params: { id: this.id }
      });
      this.secret = response.data.secret;
    } catch {
      this.found = false;
    }
  }
});
