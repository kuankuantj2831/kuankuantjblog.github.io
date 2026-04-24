/**
 * 功能 35: 表格排序
 * 点击表头自动排序表格内容
 */
(function() {
    function init(){
        document.querySelectorAll('table').forEach(function(table){
            var headers=table.querySelectorAll('th');
            headers.forEach(function(th,colIdx){
                th.style.cursor='pointer';
                th.style.userSelect='none';
                th.title='点击排序';
                var asc=true;
                th.addEventListener('click',function(){
                    var tbody=table.querySelector('tbody')||table;
                    var rows=Array.from(tbody.querySelectorAll('tr')).filter(function(r){return r.querySelector('td');});
                    rows.sort(function(a,b){
                        var aVal=(a.cells[colIdx]||{}).textContent||'';
                        var bVal=(b.cells[colIdx]||{}).textContent||'';
                        var aNum=parseFloat(aVal),bNum=parseFloat(bVal);
                        if(!isNaN(aNum)&&!isNaN(bNum))return asc?aNum-bNum:bNum-aNum;
                        return asc?aVal.localeCompare(bVal):bVal.localeCompare(aVal);
                    });
                    rows.forEach(function(r){tbody.appendChild(r);});
                    headers.forEach(function(h){h.textContent=h.textContent.replace(/ [▲▼]/,'');});
                    th.textContent+=asc?' ▲':' ▼';
                    asc=!asc;
                });
            });
        });
    }
    if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);
    else init();
})();
