async function hideReveal() {
  if (this.secretInputType == "password") {
    this.secretInputType = "text";
    this.secretInputButton = "fa-eye-slash";
  } else {
    this.secretInputType = "password";
    this.secretInputButton = "fa-eye";
  }
  await this.$nextTick();
}
