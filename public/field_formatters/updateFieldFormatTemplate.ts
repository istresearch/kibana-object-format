import { throttle } from 'lodash';

let init = false;

const updateTemplate = (showPopover: boolean) => {
  const clean = (showPopover: boolean) => {
    $(`.collection-table`).closest(`td`).children(`.euiToolTipAnchor`).remove();

    $(`.collection-table`).closest(`.kbnDocTableCell__dataField`).addClass('white-space-normal');

    $(`.collection-table`).closest(`.kbnDocViewer__value`).addClass('white-space-normal');

    $(`.collection-table-no-filter`)
      .closest('.kbnDocTableCell__dataField')
      .children('.kbnDocTableCell__filter')
      .empty();

    $(`.collection-table-no-filter`)
      .closest(`tr[data-test-subj]`)
      .children('.kbnDocViewer__buttons')
      .children('span')
      .children(`button:not([data-test-subj='toggleColumnButton'])`)
      .attr('disabled', 'true');

    if (showPopover) {
      $(`.enable-filter-popover`)
        .closest('.kbnDocTableCell__dataField')
        .children('.kbnDocTableCell__filter')
        .children(`.kbnDocTableRowFilterButton`)
        .addClass('tippy-filter-button');

      $(`.enable-filter-popover`)
        .closest(`tr[data-test-subj]`)
        .children('.kbnDocViewer__buttons')
        .children('span')
        .children(`button:not([data-test-subj='toggleColumnButton'])`)
        .closest(`.euiToolTipAnchor`)
        .addClass('tippy-filter-button');
    }
  };

  $('#kibana-body').observe(
    '.kbnDocTableCell__dataField',
    throttle(() => {
      clean(showPopover);
    }, 100)
  );

  $('#kibana-body').observe(
    '.kbnDocViewerTable tr',
    throttle(() => {
      clean(showPopover);
    }, 100)
  );
};

export default (showPopover = false) => {
  if (!init) {
    init = true;
    updateTemplate(showPopover);
  }
};
