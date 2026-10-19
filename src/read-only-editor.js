async function createReadOnlyEditor(html) {
  const {createEditor} = await import('@wangeditor/editor');

  return createEditor({
    selector: '#editor-container',
    html,
    mode: 'simple',
    config: {
      readOnly: true,
    },
  });
}

export {createReadOnlyEditor};
