import{R as s,r,u as I,z as T,j as a,F as C}from"./components-BGDyOe_B.js";import{A as F,p as L}from"./styles-B8Gy1_Dc.js";import{c as b,w as d,B as h,I as k,e as P,a as x,i as S,P as v,C as A,T as B,b as D}from"./Page-BlBOquBD.js";import"./context-D0ShNtlm.js";import"./context-DraICPrr.js";var m={Item:"Polaris-FormLayout__Item",grouped:"Polaris-FormLayout--grouped",condensed:"Polaris-FormLayout--condensed"};function f({children:e,condensed:t=!1}){const o=b(m.Item,t?m.condensed:m.grouped);return e?s.createElement("div",{className:o},e):null}function y({children:e,condensed:t,title:o,helpText:n}){const l=r.useId();let c=null,i,u=null,p;n&&(i=`${l}HelpText`,c=s.createElement(P,{id:i,color:"text-secondary"},n)),o&&(p=`${l}Title`,u=s.createElement(x,{id:p,as:"p"},o));const E=r.Children.map(e,j=>d(j,f,{condensed:t}));return s.createElement(h,{role:"group",gap:"200","aria-labelledby":p,"aria-describedby":i},u,s.createElement(k,{gap:"300"},E),c)}const g=r.memo(function({children:t}){return s.createElement(h,{gap:"400"},r.Children.map(t,w))});g.Group=y;function w(e,t){return S(e,y)?e:d(e,f,{key:t})}const $=()=>[{rel:"stylesheet",href:L}];function z(){const e=I(),t=T(),[o,n]=r.useState(""),{errors:l}=t||e;return a.jsx(F,{i18n:e.polarisTranslations,children:a.jsx(v,{children:a.jsx(A,{children:a.jsx(C,{method:"post",children:a.jsxs(g,{children:[a.jsx(x,{variant:"headingMd",as:"h2",children:"Log in"}),a.jsx(B,{type:"text",name:"shop",label:"Shop domain",helpText:"example.myshopify.com",value:o,onChange:n,autoComplete:"on",error:l.shop}),a.jsx(D,{submit:!0,children:"Log in"})]})})})})})}export{z as default,$ as links};
