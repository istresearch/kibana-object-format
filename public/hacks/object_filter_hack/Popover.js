import _ from 'lodash';
import tippy from 'tippy.js';
import 'tippy.js/dist/tippy.css';
import 'tippy.js/themes/light.css';

const DEFAULT_PROPS = {
  content: 'LOADING',
  placement: 'right',
  trigger: 'click',
  appendTo: document.body,
  interactive: true,
  allowHTML: true,
  popperOptions: {
    strategy: 'fixed',
  },
  theme: 'light',
};

class Popover {
  constructor(defaultProps = {}) {
    this._defaultProps = {
      ...DEFAULT_PROPS,
      ...defaultProps,
    };
    this._init = false;
    this._instance = null;
    this._callback = null;
    this._entryValues = [];

    tippy.setDefaultProps(this._defaultProps);
  }

  init() {
    this._init = true;
    this._instance = null;
    this._callback = null;
    this._entryValues = [];
    $('body').on(
      'submit.objectFilterForm',
      '.object-filter-form',
      this.handlerProcessForm.bind(this)
    );
    $('body').on('click.selectFilters', '.select-filters', this.handlerSelectAll.bind(this));
    $('body').on('click.filterPopver', '.tippy-filter-button', this.handlerShowPopover.bind(this));
    $('input[type="range"]').rangeslider();
  }

  destroy() {
    this._init = false;
    this._instance = null;
    this._callback = null;
    this._entryValues.length = 0;
    $('body').off('submit.objectFilterForm');
    $('body').off('click.selectFilters');
    $('body').off('click.filterPopver');
  }

  isInit() {
    return this._init;
  }

  handlerShowPopover(e) {
    this._instance = tippy(e.target, {
      onHide(instance) {
        setTimeout(() => {
          instance.unmount();
          instance.destroy();
          this._instance = null;
        }, 100);

        $('.keep-icon-visible').removeClass('keep-icon-visible');
      },
    });
    $(e.target).addClass('keep-icon-visible');
    this._instance.show();
  }

  handlerProcessForm(e) {
    e.preventDefault();
    e.stopPropagation();

    const formFields = $('.object-filter-form').serializeArray();
    const selectedEntryValues = this._entryValues.map(entryValue => ({
      ...entryValue,
      checked: formFields.findIndex(field => field.value === entryValue.value || field.value === entryValue.dHashValue) !== -1,
      distance: entryValue.dHashValue && formFields.find(field => field.name === `${entryValue.dHashValue}-distance`).value,
    }));

    this._instance.hide();
    this._callback(selectedEntryValues);
  }

  handlerSelectAll(e) {
    e.preventDefault();
    e.stopPropagation();

    const isSelectAll = $(e.target).hasClass('select-all');
    const formFields = $('.object-filter-form .po-select input');

    for (let field of formFields) {
      $(field).prop('checked', isSelectAll);
    }
  }

  formBuilder(currentFilters) {
    const formFields = this._entryValues.map(({ type, label, path, value, negate, dHashPath, dHashValue }) => {
        const filterIndex = currentFilters.findIndex(
          filter => [path, dHashPath].includes(filter.path) && [value, dHashValue].includes(filter.value) && filter.negate === negate
        );
        const filterExist = filterIndex !== -1;
        let distance = filterIndex >= 0 ? currentFilters[filterIndex].distance : 16;

        switch (type) {
          case 'text':
          case 'link':
            const lbl = label ? `<strong>${label}: </strong>` : '';
            return `
            <label class="po-select po-checkbox">
              <span>${lbl}${value}</span>
              <input type="checkbox" ${filterExist && 'checked'} name="${path}" value="${value}">
              <span class="checkmark"></span>
            </label>
            `;
          case 'image':
            return `
              <div class="po-image-container">
                <label class="po-select po-image">
                  <input type="checkbox" ${filterExist && 'checked'} name="${dHashPath || path}" value="${dHashValue || value}">
                  <div class="po-image-container">
                    <div style="background-image: url('${value}')"></div>
                  </div>
                </label>
                ${dHashValue && `
                  <div class="range-slider">
                    <div class="range-label first">Exact</div>
                    <div class="range-label last">Fuzzy</div>
                    <input type="range" name="${dHashValue}-distance-range" step="1" min="0" max="31" value="${distance}" data-rangeslider>
                    <input type="number" name="${dHashValue}-distance"  min="0" max="31" value="${distance}" data-range-input>
                  </div>
                `}
              </div>
            `;
          default:
            return null;
        }
      }
    );

    return `
      <form class="object-filter-form">
        <div class="object-filter-form-header"> 
          <div></div>
          <div>
            <a href="#" class="select-filters select-all">Select All</a> | 
            <a href="#" class="select-filters deselect-all">Deselect All</a>
          </div>
        </div>
        <div class="object-filter-form-body"> 
          ${formFields.join('')}
        </div>
        <div class="object-filter-form-footer"> 
          <button class="euiButton euiButton--primary euiButton--fill euiButton--small" type="submit">
            <span class="euiButton__content">
              <span class="euiButton__text">Set Filters</span>
            </span>
          </button>
        </div>
      </form>`;
  }

  setForm(entryValues, currentFilters, callback) {
    this._entryValues = entryValues;
    this._callback = callback;
    const formhtml = this.formBuilder(currentFilters);
    this.setContent(formhtml);
  }

  setContent(content) {
    setTimeout(() => {
      if (this._instance) {
        this._instance.setContent('');
        this._instance.setContent(content);
        this.rangeSlider();
      }
    }, 0);
  }

  rangeSlider() {
    $('[data-rangeslider]').on("change mousemove", function() {
        $(this).next().val($(this).val());
     });
     $('[data-range-input]').on("input", function() {
      $(this).prev().val($(this).val());
   });
  }

  hide() {
    setTimeout(() => {
      if (this._instance) {
        this._instance.hide();
      }
    }, 0);
  }
}

export default Popover;
