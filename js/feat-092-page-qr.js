/**
 * 功能 92: 页面二维码生成
 */
(function(){window.showPageQR=function(){var url=location.href;var qrUrl='https://api.qrserver.com/v1/create-qr-code/?size=200x200&data='+encodeURIComponent(url);var overlay=document.createElement('div');Object.assign(overlay.style,{position:'fixed',inset:'0',background:'rgba(0,0,0,0.7)',zIndex:'999999',display:'flex',alignItems:'center',justifyContent:'center',cursor:'pointer'});overlay.innerHTML='<div style="background:#fff;padding:30px;border-radius:16px;text-align:center;"><img src="'+qrUrl+'" width="200" height="200" style="border-radius:8px;"><p style="margin-top:12px;color:#666;font-size:13px;">扫码访问本页</p></div>';overlay.addEventListener('click',function(){overlay.remove();});document.body.appendChild(overlay);};})();
