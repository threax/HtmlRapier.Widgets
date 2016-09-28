jsns.define("hr.data.paged", [
    "hr.http",
    "hr.eventhandler"
],
function (exports, module, http, EventHandler) {

    function PagedData(src, resultsPerPage) {
        var updating = new EventHandler();
        this.updating = updating.modifier;

        var updated = new EventHandler();
        this.updated = updated.modifier;

        var error = new EventHandler();
        this.error = error.modifier;

        this.resultsPerPage = resultsPerPage;
        this.currentPage = 0;

        function updateData() {
            updating.fire();
            var url = src + '?page=' + this.currentPage + '&count=' + this.resultsPerPage;
            http.get(url)
            .then(function (data) {
                updated.fire(data);
            })
            .catch(function (data) {
                error.fire(data);
            });
        }
        this.updateData = updateData;
    }

    module.exports = PagedData;
});