/// <reference types="react" />

declare module 'react-datepicker';

// Don't redefine Window.confirm as it's already defined in lib.dom.d.ts
// interface Window {
//   confirm: (message: string) => boolean;
// }

// No need to declare JSX namespace as it's handled by @types/react
// declare namespace JSX {
//   interface IntrinsicElements {
//     // ... removed as these are already defined in @types/react
//   }
// } 