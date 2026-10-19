/**
 * 页脚组件。
 */
function footerData() {
  return {
    handleTop() {
      window.scrollTo({top: 0, behavior: 'smooth'});
    },
  };
}

export {footerData};
