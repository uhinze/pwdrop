let retrievePw = new Vue({
  el: "#retrieve-pw",
  data: {
    id: "",
    secret: ""
  },
  async beforeMount() {
    let uri = window.location.search.substring(1);
    let params = new URLSearchParams(uri);
    this.id = params.get("id");
    let response = await axios.get("/secret", {
      params: { id: this.id }
    });
    this.secret = response.data.secret;
  }
});
