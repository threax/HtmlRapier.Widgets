jsns.define("hr.widgets.pagenumbers", [
    "hr.toggles",
    "hr.eventhandler"
],
function (exports, module, toggles, EventHandler) {

    function PageNumbers(model, toggleProvider) {
        var pageToggles = [];
        var totalPages = 0;
        var buttonGroup = new toggles.Group();
        findToggles();
        var numButtons = pageToggles.length;
        var halfButton = Math.floor(numButtons / 2);
        var pageChangeRequested = new EventHandler();
        this.pageChangeRequested = pageChangeRequested.modifier;
        var lowestDisplayedPage = 0;
        var self = this;

        this.currentPage = 0;
        this.totalResults = 0;
        this.resultsPerPage = 0;

        function moveToPage(newPageNum) {
            pageChangeRequested.fire(newPageNum);
        }

        function pageNumberLink(index) {
            return function () {
                moveToPage(lowestDisplayedPage + index);
            }
        }

        function next() {
            var page = self.currentPage + 1;
            if (page < totalPages) {
                moveToPage(page)
            }
        }

        function previous() {
            var page = self.currentPage - 1;
            if (page >= 0) {
                moveToPage(page)
            }
        }

        function findToggles() {
            var bindings = {
                previousPage: function (evt) {
                    evt.preventDefault();
                    previous();
                },
                nextPage: function (evt) {
                    evt.preventDefault();
                    next();
                }
            };
            var states = ["on", "off", "active"];
            var t = 0;
            var currentPage = 'page' + t;
            var toggle = toggleProvider.getToggle(currentPage, states);
            while (!toggles.isNullToggle(toggle)) {
                pageToggles.push(toggle);
                buttonGroup.add(toggle);
                bindings[currentPage] = pageNumberLink(t);
                currentPage = 'page' + ++t;
                toggle = toggleProvider.getToggle(currentPage, states);
            }
            toggleProvider.setListener(bindings);
        }

        function updatePages() {
            totalPages = Math.floor(this.totalResults / this.resultsPerPage);
            if (this.totalResults % this.resultsPerPage !== 0) {
                ++totalPages;
            }

            var j = 0;
            var i;

            if (this.currentPage + halfButton > totalPages) {
                i = totalPages - numButtons;
            }
            else {
                i = this.currentPage - halfButton;
            }
            if (i < 0) {
                i = 0;
            }
            lowestDisplayedPage = i;
            model.setData(function (page) {
                if (i === self.currentPage) {
                    buttonGroup.activate(pageToggles[j], 'active', 'on');
                }
                if (i >= totalPages) {
                    pageToggles[j].off();
                }
                ++j;
                return i++ + 1;
            });
        }
        this.updatePages = updatePages;
    }

    module.exports = PageNumbers;
});