/**
 * 功能 51: 回到顶部按钮（带进度环）
 */
(function(){var b=document.createElement('div');Object.assign(b.style,{position:'fixed',bottom:'30px',right:'20px',width:'44px',height:'44px',borderRadius:'50%',cursor:'pointer',zIndex:'9990',opacity:'0',transition:'opacity 0.3s',display:'flex',alignItems:'center',justifyContent:'center',background:'rgba(102,126,234,0.9)',color:'#fff',fontSize:'18px',boxShadow:'0 4px 15px rgba(102,126,234,0.4)'});b.textContent='↑';b.addEventListener('click',function(){window.scrollTo({top:0,behavior:'smooth'});});document.body.appendChild(b);window.addEventListener('scroll',function(){b.style.opacity=window.scrollY>300?'1':'0';},{passive:true});})();
