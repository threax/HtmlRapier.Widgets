jsns.define("thednp.bootstrap.native.scrollspy", [], function(exports, module ) {// Native Javascript for Bootstrap 3 | ScrollSpy
// by dnp_theme

(function(factory){

  // CommonJS/RequireJS and "native" compatibility
  if(typeof module !== "undefined" && typeof exports == "object") {
    // A commonJS/RequireJS environment
    if(typeof window != "undefined") {
      // Window and document exist, so return the factory's return value.
      module.exports = factory();
    } else {
      // Let the user give the factory a Window and Document.
      module.exports = factory;
    }
  } else {
    // Assume a traditional browser.
    window.ScrollSpy = factory();
  }

})(function(){

  var isIE = (new RegExp("MSIE ([0-9]{1,}[\.0-9]{0,})").exec(navigator.userAgent) != null) ? parseFloat( RegExp.$1 ) : false,
    addClass = function(el,c) { // where modern browsers fail, use classList  
      if (el.classList) { el.classList.add(c); } else { el.className += ' '+c; el.offsetWidth; }
    },
    removeClass = function(el,c) {
      if (el.classList) { el.classList.remove(c); } else { el.className = el.className.replace(c,'').replace(/^\s+|\s+$/g,''); }
    };

  //SCROLLSPY DEFINITION
  var ScrollSpy = function(element,item,options) {
    options = options || {};
    
    //this is the container element we spy it's elements on
    this.element = typeof element === 'object' ? element : document.querySelector(element);

    this.options = {};
    // this is the UL menu component our scrollSpy object will target, configure and required by the container element
    this.options.target = options.target ? (typeof options.target === 'object' ? options.target : document.querySelector(options.target)) : null;

    //we need to determine the index of each menu item
    this.items = this.options.target && this.options.target.getElementsByTagName('A');

    this.item = item;
    // the parent LI element
    this.parent = this.item.parentNode;

    // the upper level LI ^ UL ^ LI, this is required for dropdown menus
    this.parentParent = this.parent.parentNode.parentNode;

    this.tg = this.item.href && document.getElementById(this.item.getAttribute('href').replace('#',''));
    this.active = false;
    this.topEdge = 0;
    this.bottomEdge = 0;
    var self = this;

    //determine which is the real scrollTarget
    if ( this.element.offsetHeight < this.element.scrollHeight ) { // or this.scrollHeight()
      this.scrollTarget = this.element;
    } else {
      this.scrollTarget = window;
    }

    if ( !this.options.target ) { return; }

    this.topLimit = function () { // the target offset
      if ( this.scrollTarget === window ) {
        return this.tg.getBoundingClientRect().top + this.scrollOffset() - 5
      } else {
        return this.tg.offsetTop;
      }
    }
    this.bottomLimit = function () {
      return this.topLimit() + this.tg.clientHeight
    }
    this.checkEdges = function () {
      this.topEdge = this.topLimit();
      this.bottomEdge = this.bottomLimit()
    }
    this.scrollOffset = function () {
      if ( this.scrollTarget === window ) {
        return window.pageYOffset || document.documentElement.scrollTop
      } else {
        return this.element.scrollTop
      }
    }
    this.activate = function () {
      if ( this.parent && this.parent.tagName === 'LI' && !/\bactive/.test(this.parent.className) ) {
        addClass(this.parent,'active');
        if ( this.parentParent && this.parentParent.tagName === 'LI' // activate the dropdown as well
          && /\bdropdown/.test(this.parentParent.className)
          && !/\bactive/.test(this.parentParent.className) ) { addClass(this.parentParent,'active'); }
        this.active = true
      }
    }
    this.deactivate = function () {
      if ( this.parent && this.parent.tagName === 'LI' && /\bactive/.test(this.parent.className) ) {
        removeClass(this.parent,'active');
        if ( this.parentParent && this.parentParent.tagName === 'LI' // deactivate the dropdown as well
          && /\bdropdown/.test(this.parentParent.className)
          && /\bactive/.test(this.parentParent.className) ) { removeClass(this.parentParent,'active'); }
        this.active = false
      }
    }
    this.toggle = function () {
      if ( this.active === false
        && ( this.bottomEdge > this.scrollOffset() && this.scrollOffset() >= this.topEdge )) { //regular use, scroll just entered the element's topLimit or bottomLimit
          this.activate();
      } else if (this.active === true && (this.bottomEdge <= this.scrollOffset() && this.scrollOffset() < this.topEdge )) {
        this.deactivate()
      }
    }
    this.refresh = function () { // check edges again
      this.deactivate();
      this.checkEdges();

      this.toggle() // If any case update values again
    }
    this.scrollEvent = function(){
      function onSpyScroll() {
        self.refresh();
      }
      this.scrollTarget.addEventListener('scroll', onSpyScroll, false);
    }
    this.resizeEvent = function(){
      function onSpyResize() {
        self.refresh()
      }
      window.addEventListener('resize', onSpyResize, false);
    }
    this.scrollHeight = function() {
      if ( this.scrollTarget === window ) {
        return Math.max( document.body.scrollHeight, document.body.offsetHeight, 
          document.documentElement.clientHeight, document.documentElement.scrollHeight, document.documentElement.offsetHeight );
      } else {
        return this.element.scrollHeight
      }
    }

    // init
    if ( this.item.getAttribute('href') && this.item.getAttribute('href').indexOf('#') > -1 ) {
      //actions
      this.checkEdges();
      this.refresh()
      this.scrollEvent();
      if (!(isIE && isIE < 9)) { this.resizeEvent(); }
    }
  };


  //SCROLLSPY API
  //=============
  var scrollSpyes = document.querySelectorAll('[data-spy="scroll"]'), i = 0, ssl = scrollSpyes.length; // mostly is the document.body or a large container with many elements having id="not-null-id"
  for (i;i<ssl;i++) {
    var spy = scrollSpyes[i], options = {};
    options.target = spy.getAttribute('data-target') || null;  // this must be a .nav component with id="not-null"  
    if ( options.target !== null ) {
      var menu = options.target === 'object' ?  options.target : document.querySelector(options.target),
        items = menu.querySelectorAll('a'), j = 0, il = items.length;
      for (j;j<il;j++) {
        var item = items[j];
        if ( item.href && item.getAttribute('href') !== '#' )
        new ScrollSpy(spy, item, options);
      }
    }
  }

  return ScrollSpy;

});});