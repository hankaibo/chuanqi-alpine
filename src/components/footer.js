/**
 * 页脚组件。
 */
function footerData() {
  return {
    footerHtml: '',
    isMobile: window.matchMedia('(max-width: 768px)').matches,

    handleTop() {
      window.scrollTo({top: 0, behavior: 'smooth'});
    },

    init() {
      const localHtml = this.isMobile ? './footer-mobile.html' : './footer.html';
      this.$nextTick(() => {
        fetch(localHtml)
          .then((response) => response.text())
          .then((data) => {
            this.footerHtml = data;
          })
          .catch((error) => console.error('Error loading footer:', error));
      });
    },
  };
}

export {footerData};
