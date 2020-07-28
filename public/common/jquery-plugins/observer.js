// https://github.com/rkusa/jquery-observe - A simple mutation observer for jQuery.
// aaxelrod - added disconnect functionality to jquery $.fn 
!function($) {
    var MutationObserver = window.MutationObserver || window.WebKitMutationObserver || window.MozMutationObserver
    var Observer = function(target, selector, onAdded, onRemoved) {
      var self    = this
      this.target = target
      
      var childsOnly = selector[0] === '>'
        , search = childsOnly ? selector.substr(1) : selector
        
      function apply(nodes, callback) {
        Array.prototype.slice.call(nodes).forEach(function(node) {
          if (childsOnly && self.target[0] !== $(node).parent()[0]) return
          if ($(node).is(search)) callback.call(node)
          if (childsOnly) return
          $(selector, node).each(function() {
            callback.call(this)
          })
        })
      }
      
      this.observer = new MutationObserver(function(mutations) {
        self.disconnect()
        
        mutations.forEach(function(mutation) {
          if (onAdded)   apply(mutation.addedNodes,   onAdded)
          if (onRemoved) apply(mutation.removedNodes, onRemoved)
        })
    
        self.observe()
      })
      
      // call onAdded for existing elements
      $(selector, target).each(function() {
        onAdded.call(this)
      })
      
      this.observe()
    }
    
    Observer.prototype.disconnect = function() {
      this.observer.disconnect()
    }
    
    Observer.prototype.observe = function() {
      var self = this
      this.target.forEach(function(target) {
        self.observer.observe(target, { attributes: true,  childList: true, subtree: true })
      })
    }
    
    $.fn.observe = function(selector, onAdded, onRemoved) {
      if (!this.length) return
      var contracts = this.data('contracts')
      if (!contracts) contracts = []
      var contract = contracts.filter(function(c) { return c.selector === selector })
      if (contract.length) {
        contract[0].onAdded   = onAdded
        contract[0].onRemoved = onRemoved
        return
      }
      var target = 'makeArray' in $ ? $.makeArray(this) : this
      var observer = new Observer(target, selector, onAdded, onRemoved)
      contracts.push(observer)
      this.data('contracts', contracts)
      return this
    }

    // aaxelrod - Added custom disconnect. 
    $.fn.disconnect = function() {
      var contracts = this.data('contracts');
      if (contracts && contracts.length) {
        contracts.forEach(function(contract) {
          contract.observer.disconnect();
        });
      }
      return this;
    }
  }(window.Zepto || window.jQuery)