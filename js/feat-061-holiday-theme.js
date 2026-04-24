/**
 * 功能 61: 节日主题自动切换
 * 根据日期自动应用节日主题样式
 */
(function(){var d=new Date(),m=d.getMonth()+1,day=d.getDate();var theme=null;if(m===1&&day===1)theme={name:'元旦',emoji:'🎆',color:'#ff6b6b'};else if(m===2&&day>=10&&day<=16)theme={name:'春节',emoji:'🧧',color:'#e74c3c'};else if(m===5&&day===1)theme={name:'劳动节',emoji:'💪',color:'#f39c12'};else if(m===6&&day===1)theme={name:'儿童节',emoji:'🎈',color:'#e91e63'};else if(m===10&&day===1)theme={name:'国庆节',emoji:'🇨🇳',color:'#e74c3c'};else if(m===12&&day===25)theme={name:'圣诞节',emoji:'🎄',color:'#27ae60'};if(theme){console.log('%c'+theme.emoji+' 今天是'+theme.name+'！','color:'+theme.color+';font-size:16px;font-weight:bold;');}})();
