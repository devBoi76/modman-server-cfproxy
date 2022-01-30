import * as packages from "./package"
import {REPOSITORY, PORT} from "./main"
export function default_template(content: string): string {
    return `<!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta http-equiv="X-UA-Compatible" content="IE=edge">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Document</title>
    </head>
    <body>
    ${css()}
    <div class="container">
    ${content}
    </div>
    </body>
    </html>
   `
}

function css(): string {
    return `<style>
    .container {
      width: 60%;
      margin-inline: auto;
      border: 1px solid black;
      padding: 1rem;
      border-radius: 0.5rem;
    }
    .package {
      border-bottom: 1px solid gray;   
    }
    .package:nth_child(2n+1) {
      background-color: #000000;
    }
    .package p {
      display: inline-block;    
    }
    .package .name {
      font-size: 1.25rem;
      border-right: 1px solid gray;
      padding-right: 1rem;
      width: max-content;
    }
    .package .description {
      padding-left: 1rem;
    }
  </style>`
}

export function package_list(packages: Array<packages.Package>): string {
    let list = ``//`<input type="text" id="cf-id" placeholder="Input the curseforge id to index..."><br>
    // <button onclick="post('${REPOSITORY}/add_cf_to_be_indexed', document.getElementById('cf-id'))">Submit</button>`;
    for (const p of packages) {
        list += `<div class="package"><p class="name">${p.name}</p><p class="description">${p.description}</p></div>`;
    }
    return list;
}

// function js(): string {
//     return `<script>
//     function post(url, jsondata) {

//         var xhr = new XMLHttpRequest();
//         xhr.open("POST", url);
        
//         xhr.setRequestHeader("Accept", "application/json");
//         xhr.setRequestHeader("Content-Type", "application/json");
        
//         xhr.onreadystatechange = function () {
//             if (xhr.readyState === 4) {
//                 console.log(xhr.responseText);
//             }
//         };
//         xhr.send(jsondata)
//     }
            
//     </script>`
// }