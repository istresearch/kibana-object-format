const cleanTemplate = () => {
  const clean = () => {
    $(`.collection-table`)
      .closest(`td`)
      .children(`.euiToolTipAnchor`)
      .remove();

    $(`.collection-table`)
      .closest(`.kbnDocTableCell__dataField`)
      .addClass('white-space-normal');

    $(`.collection-table`)
      .closest(`.kbnDocViewer__value`)
      .addClass('white-space-normal');

    $(`.collection-table-no-filter`)
      .closest('.kbnDocTableCell__dataField')
      .children('.kbnDocTableCell__filter')
      .empty();

    $(`.collection-table-no-filter`)
      .closest(`tr[data-test-subj]`)
      .children('.kbnDocViewer__buttons')
      .children('span')
      .children(`button:not([data-test-subj='toggleColumnButton'])`)
      .attr('disabled', true);
  };

  const targetNode = document.getElementById('kibana-app');
  const config = { attributes: true, childList: true, subtree: true };
  const callback = function(mutationsList, observer) {
    for (let mutation of mutationsList) {
      if (
        mutation &&
        mutation.target &&
        mutation.target.className &&
        mutation.target.className.indexOf &&
        (mutation.target.className.indexOf('kbnDocTableCell__dataField') !== -1 ||
          mutation.target.className.indexOf('kbnDocTableDetails__row') !== -1)
      ) {
        clean();
      }
    }
  };

  if (targetNode) {
    const observer = new MutationObserver(callback);
    observer.observe(targetNode, config);
  }
};

export default () => {
  setTimeout(() => {
    if ($('.application.tab-discover').length) {
      cleanTemplate();
    }
  }, 0);
};
