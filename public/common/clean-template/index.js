import _ from "lodash";
import "../jquery-plugins/observer";

const cleanTemplate = (showPopover) => {
  const clean = (showPopover) => {
    $(`.collection-table`).closest(`td`).children(`.euiToolTipAnchor`).remove();

    $(`.collection-table`)
      .closest(`.kbnDocTableCell__dataField`)
      .addClass("white-space-normal");

    $(`.collection-table`)
      .closest(`.kbnDocViewer__value`)
      .addClass("white-space-normal");

    $(`.collection-table-no-filter`)
      .closest(".kbnDocTableCell__dataField")
      .children(".kbnDocTableCell__filter")
      .empty();

    $(`.collection-table-no-filter`)
      .closest(`tr[data-test-subj]`)
      .children(".kbnDocViewer__buttons")
      .children("span")
      .children(`button:not([data-test-subj='toggleColumnButton'])`)
      .attr("disabled", true);

    if (showPopover) {
      $(`.collection-object-table`)
        .closest(".kbnDocTableCell__dataField")
        .children(".kbnDocTableCell__filter")
        .children(`.kbnDocTableRowFilterButton`)
        .addClass("tippy-filter-button");

      $(`.collection-object-table`)
        .closest(`tr[data-test-subj]`)
        .children(".kbnDocViewer__buttons")
        .children("span")
        .children(`button:not([data-test-subj='toggleColumnButton'])`)
        .closest(`.euiToolTipAnchor`)
        .addClass("tippy-filter-button");
    }
  };

  $("#kibana-app").observe(
    ".kbnDocTableCell__dataField",
    _.throttle(() => {
      clean(showPopover);
    }, 1000)
  );

  $("#kibana-app").observe(
    ".kbnDocViewerTable tr",
    _.throttle(() => {
      clean(showPopover);
    }, 1000)
  );
};

export default (showPopover = false) => {
  setTimeout(() => {
    if ($(".application.tab-discover").length) {
      cleanTemplate(showPopover);
    }
  }, 0);
};
