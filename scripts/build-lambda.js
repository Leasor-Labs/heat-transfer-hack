const esbuild = require("esbuild");
const path = require("path");

const outDir = path.join(__dirname, "..", "build");

// #region agent log
fetch('http://127.0.0.1:7528/ingest/59cacce0-7747-4658-a89b-976b0f7d76a2',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'d3ad2d'},body:JSON.stringify({sessionId:'d3ad2d',location:'build-lambda.js:start',message:'Lambda build starting',data:{entryPoint:'lambdaRouter.ts'},timestamp:Date.now(),hypothesisId:'H2'})}).catch(()=>{});
// #endregion

esbuild
  .build({
    entryPoints: [path.join(__dirname, "..", "src", "api", "lambdaRouter.ts")],
    bundle: true,
    platform: "node",
    target: "node20",
    format: "cjs",
    outfile: path.join(outDir, "index.js"),
    external: ["express"],
    sourcemap: true,
  })
  .then(() => {
    // #region agent log
    fetch('http://127.0.0.1:7528/ingest/59cacce0-7747-4658-a89b-976b0f7d76a2',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'d3ad2d'},body:JSON.stringify({sessionId:'d3ad2d',location:'build-lambda.js:success',message:'Lambda build succeeded',data:{},timestamp:Date.now(),hypothesisId:'H2'})}).catch(()=>{});
    // #endregion
    console.log("Lambda build done: build/index.js");
  })
  .catch((err) => {
    // #region agent log
    fetch('http://127.0.0.1:7528/ingest/59cacce0-7747-4658-a89b-976b0f7d76a2',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'d3ad2d'},body:JSON.stringify({sessionId:'d3ad2d',location:'build-lambda.js:catch',message:'Lambda build failed',data:{error:String(err&&err.message||err),stack:err&&err.stack?String(err.stack).slice(0,500):undefined},timestamp:Date.now(),hypothesisId:'H1'})}).catch(()=>{});
    // #endregion
    console.error(err);
    process.exit(1);
  });
