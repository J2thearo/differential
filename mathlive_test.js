new p5((p) => {

  let plot;
  let xDim;
  let yDim;
  let posX;
  let posY;
  let canvas;
  let ast
  let f, df

  function linedash(x1, y1, x2, y2, list) {
   drawingContext.setLineDash(list); // set the "dashed line" mode
   line(x1, y1, x2, y2); // draw the line
   drawingContext.setLineDash([]); // reset into "solid line" mode
  }

  function inside(){
    p.loop();
  }

  function outside(){
    p.noLoop();
  }

  p.windowResized = () => {
    if(p.windowWidth <= p.windowHeight){
         p.resizeCanvas(p.windowWidth, p.windowWidth);
       } else {
         p.resizeCanvas(p.windowHeight, p.windowHeight);
       }
       posX = p.width*0.09;
       posY = p.width*0.05;
       xDim = p.width*0.85;
       yDim = p.width*0.85;
       plot.setPos(posX, posY);
       plot.setOuterDim(xDim, xDim);
       plot.setGridLineWidth(p.width*0.001);
       plot.mainLayer.setLabelSeparation([p.width*0.008,-p.width*0.01]);
       plot.xAxis.fontSize = p.width*0.035;
       plot.yAxis.fontSize = p.width*0.035;
       plot.xAxis.setLineWidth(p.width*0.006);
       plot.yAxis.setLineWidth(p.width*0.006);
       plot.xAxis.setTickLength(p.width*0.006);
       plot.yAxis.setTickLength(p.width*0.006);
       plot.xAxis.setTickLabelOffset(p.width*0.006);
       plot.yAxis.setTickLabelOffset(p.width*0.006);
       plot.xAxis.tickLineWidth = p.width*0.004;
       plot.yAxis.tickLineWidth = p.width*0.004;
       plot.xAxis.lab.fontSize = p.width*0.035;
       plot.yAxis.lab.fontSize = p.width*0.035;
       plot.xAxis.lab.offset = p.width*0.05;
       plot.yAxis.lab.offset = p.width*0.05;
       plot.xAxis.setOffset(p.width*0.01);
       plot.yAxis.setOffset(p.width*0.01);
       plot.mainLayer.lineWidth = p.width*0.004;
  }

  function applySuperscriptAsPower(mjs, mathJson, config) {
      let result = mjs;
      if (typeof mathJson === 'object' && mathJson.sup !== undefined) {
          result = new window.math.FunctionNode(
              'pow', [result, mathJsonToMathjs(mathJson.sup, config)]);
      }
      return result;
  }

  function getMathjsArgs(mathJson, config) {
      let result = [];
      if (Array.isArray(mathJson.arg)) {
          for (let index = 0; index < mathJson.arg.length; index++) {
              result.push(mathJsonToMathjs(mathJson.arg[index], config));
          }
      } else {
          result = [mathJsonToMathjs(mathJson.arg, config)];
      }
      return result;
  }
  /**
   * Return an array of arguments, with the sub if present as the last argument.
   */
  function getMathjsArgsWithSub(mathJson, config) {
      const result = getMathjsArgs(mathJson, config);
      if (mathJson.sub !== undefined) {
          result.push(mathJsonToMathjs(mathJson.sub, config));
      }
      return result;
  }
  /**
   * Return a mathjs node tree corresponding to the MathjSON object
   * @param {Object.<string,any>} mathJson
   */
  function mathJsonToMathjs(mathJson, config) {
      let result;
      if (mathJson === undefined) {
          return undefined;}
      if (mathJson.num !== undefined) {
          let n = mathJson.num;
          // Convert to BigNum if required
          if (config.number === 'BigNumber') {
              n = window.math.bignumber(n);}
          result = new window.math.ConstantNode(n);
          // Apply the superscript as an operation
          result = applySuperscriptAsPower(result, mathJson, config);
      } else if (mathJson.sym !== undefined) {
          const BUILT_IN_CONSTANTS = {
              'π':        window.math.pi,
              '\u03c4':   window.math.tau,         // GREEK SMALL LETTER TAU
              '\u212f':   window.math.e,           // ℯ SCRIPT SMALL E
              '\u2147':   window.math.e,           // ⅇ DOUBLE-STRUCK ITALIC SMALL E
              'e':        window.math.e,
              '\u03d5':   window.math.phi,         //  GREEK SMALL LETTER PHI
              '\u2148':   window.math.i,           // ⅈ DOUBLE-STRUCK ITALIC SMALL I
              '\u2149':   window.math.i,           // ⅉ DOUBLE-STRUCK ITALIC SMALL J
              'i':        window.math.i,           //
          }
          const symbol = mathJson.sym;
          if (BUILT_IN_CONSTANTS[symbol]) {
              result = new window.math.ConstantNode(BUILT_IN_CONSTANTS[symbol]);
          } else {
              result = new window.math.SymbolNode(mathJson.sym);
          }
          result = applySuperscriptAsPower(result, mathJson, config);
    }
      else if (mathJson.fn) {
          if (mathJson.fn === 'log' ||
              (mathJson.fn === 'ln' && mathJson.fn.sub !== undefined)) {
              result = new window.math.FunctionNode(
                  'log', getMathjsArgsWithSub(mathJson, config));
          }
          else if (mathJson.fn === 'lb') {
              const args = getMathjsArgs(mathJson, config);
              args.push(new window.math.ConstantNode(window.math.bignumber(2)));
              result = new window.math.FunctionNode('log', args);

          }
          else if (mathJson.fn === 'lg') {
              result = new window.math.FunctionNode(
                  new window.math.SymbolNode('log10'),
                  getMathjsArgs(mathJson, config));
          }
          else if (mathJson.fn === 'negate') {
            // result = new window.math.FunctionNode(
              //   'unaryMinus', getMathjsArgs(mathJson, config));
              const args = getMathjsArgs(mathJson, config);
              result = new math.OperatorNode('-', 'unaryMinus', args)
          }
          else if (mathJson.fn === 'add' || mathJson.fn === 'subtract' ||
                   mathJson.fn === 'multiply' || mathJson.fn === 'divide') {
              const args = getMathjsArgs(mathJson, config);
              const fnName = {'add':'+', 'subtract':'-','multiply':'*','divide':'/'}
              result = new math.OperatorNode(fnName[mathJson.fn], mathJson.fn, [args[0], args[1]])
            }
          else {
              const fnName = {
                  'randomReal':       'random',
                  'randomInteger':    'randomInt',
                  'Gamma':            'gamma',
                  'Re':               're',
                  'Im':               'im',
                  'binom':            'composition',
                  'ucorner':          'ceil',
                  'lcorner':          'floor',
                  'arccos':           'acos',
                  'arcsin':           'asin',
                  'arctan':           'atan',
                  'arcosh':           'acosh',
                  'arsinh': '         asinh'}[mathJson.fn] || mathJson.fn;
                  result = new window.math.FunctionNode(
                      fnName, getMathjsArgs(mathJson, config));
          }
      } else if (mathJson.group) {
          result = applySuperscriptAsPower(
              mathJsonToMathjs(mathJson.group, config), mathJson, config);
      }
      return result;
  }

  p.setup = () => {

  if(p.windowWidth <= p.windowHeight){
      canvas = p.createCanvas(p.windowWidth, p.windowWidth);
    } else {
      canvas = p.createCanvas(p.windowHeight, p.windowHeight);
    }
  canvas.parent('sketch');
  //let wrapper = select(".wrapper")
  //background(50);
  canvas.mouseOver(inside);
  canvas.mouseOut(outside);

  posX = p.width*0.09;
  posY = p.width*0.05;

  // Create a new plot and set its position on the screen
  plot = new GPlot(p);

  plot.activatePanning();
  //plot.zoom(1.03);
  plot.activateZooming(1.01, p.CENTER, p.CENTER);
  //plot.activateCentering()
  //plot.preventWheelDefault();
  //plot.activatePointLabels();


  plot.setMar(0,0,0,0);

  // Set the plot title and the axis labels
  xDim = p.width*0.85;
  yDim = p.width*0.85;
  plot.setPos(posX, posY);
  plot.setOuterDim(xDim, xDim);

  plot.xAxis.setNTicks(7);
  plot.yAxis.setNTicks(7);
  // grid settings
  //plot.xAxis.setSmallTickLength(10);
  plot.setGridLineWidth(p.width*0.001);
  plot.setGridLineColor(100);

  // LABEL SETTINGS
  plot.mainLayer.setFontColor(100);
  //plot.mainLayer.setLabelBgColor(0);
  //plot.mainLayer.setFontSize(24);
  plot.mainLayer.setLabelSeparation([p.width*0.008,-p.width*0.01]);

  // AXIS SETTINGS
  // x and y intervals
  plot.setXLim(-5, 5);
  plot.setYLim(-5, 5);
  // x and y axis/labels
  // let supText = new String("2");
  // console.log(supText.sup())
  let coordinateSystemColor = p.color(100);
  plot.getXAxis().setAxisLabelText("x");
  plot.getYAxis().setAxisLabelText("f(x)");

  plot.xAxis.fontSize = p.width*0.035;
  plot.yAxis.fontSize = p.width*0.035;
  plot.xAxis.lab.fontColor = coordinateSystemColor
  plot.yAxis.lab.fontColor = coordinateSystemColor
  //plot.setTitleText("A very simple example");
  plot.xAxis.lineColor = coordinateSystemColor
  plot.yAxis.lineColor = coordinateSystemColor
  plot.xAxis.fontColor = coordinateSystemColor
  plot.xAxis.setLineWidth(p.width*0.006);
  plot.yAxis.setLineWidth(p.width*0.006);
  plot.xAxis.setTickLength(p.width*0.006);
  plot.yAxis.setTickLength(p.width*0.006);
  plot.xAxis.setTickLabelOffset(p.width*0.006);
  plot.yAxis.setTickLabelOffset(p.width*0.006);
  // plot.xAxis.setSmallTickLength(6);
  // plot.yAxis.setSmallTickLength(6);
  plot.xAxis.tickLineWidth = p.width*0.004;
  plot.yAxis.tickLineWidth = p.width*0.004;
  // x and y scalling
  plot.yAxis.fontColor = coordinateSystemColor
  plot.xAxis.lab.fontSize = p.width*0.035;
  plot.yAxis.lab.fontSize = p.width*0.035;
  plot.xAxis.lab.offset = p.width*0.05;
  plot.yAxis.lab.offset = p.width*0.05;
  plot.yAxis.setRotateTickLabels(false);
  plot.xAxis.setOffset(p.width*0.01);
  plot.yAxis.setOffset(p.width*0.01);

  // GRAPH SETTINGS
  // Color
  plot.mainLayer.lineColor = p.color(coordinateSystemColor);
  // p.width
  plot.mainLayer.lineWidth = p.width*0.004;

  // BOX SETTINGS
  plot.setBoxBgColor(255);
  plot.setBoxLineColor(coordinateSystemColor)
  //plot.boxLineWidth = 0;
  plot.setBgColor(coordinateSystemColor);
  //noLoop();

  const mf = MathLive.makeMathField('mf', {
          onContentDidChange: mathfield => {
          try {
              ast = MathLive.latexToAST(mathfield.$text());
              f = mathJsonToMathjs(ast, {});
              //f = math.simplify(f)
              df = math.derivative(f,'x')
              // console.log("text: " + mathfield.$text());
              // console.log("ast: ", ast);
              // console.log("parser: ", mathJsonToMathjs(ast, {}));
              // console.log("code: ", mathJsonToMathjs(ast, {}).toString());
          } catch(e) {

          }
      },
          virtualKeyboardMode: 'manual',
          customVirtualKeyboardLayers: {
            'four-op': `
              <div class='rows'>
                  <ul><li class='keycap'>7</li>
                      <li class='keycap' >8</li>
                      <li class='keycap' >9</li>
                      <li class='keycap' data-insert='\\frac{#0}{#?}'>&divide;</li>
                      <li class='keycap' data-insert='e'>e</li>
                      <li class='separator w10'/>
                      <li class='separator'/>
                  </ul>
                  <ul><li class='keycap '>4</li>
                      <li class='keycap' >5</li>
                      <li class='keycap' >6</li>
                      <li class='keycap' data-insert='\\cdot '>&times;</li>
                      <li class='keycap' data-insert='\\pi'>π</li>
                      <li class='separator w10'/>
                      <li class='separator'/>
                  </ul>
                  <ul>
                      <li class='keycap '>1</li>
                      <li class='keycap' >2</li>
                      <li class='keycap' >3</li>
                      <li class='keycap'>-</li>
                      <li class='keycap tex' data-alt-keys='(' >(</li>
                      <li class='keycap tex' data-alt-keys=')' >)</li>
                      <li class='action font-glyph bottom right w10' data-command='"deleteAll"'>AC</li>
                  </ul>
                  <ul>
                      <li class='keycap' data-key='0'>0</li>
                      <li class='keycap' >.</li>
                      <li id='x1' class='keycap' data-insert='x'><a>x</a></li>
                      <style>
                            @font-face {
                                font-family: myFirstFont;
                                src: url(libraries/dist/fonts/KaTeX_Math-Italic.woff2);
                            }
                            #x1 {
                                 font-family: myFirstFont;
                            }
                      </style>
                      <li class='keycap'>+</li>
                      <li class='action' data-command='"moveToPreviousChar"'><svg><use xlink:href='#svg-arrow-left' /></svg></li>
                      <li class='action' data-command='"moveToNextChar"'><svg><use xlink:href='#svg-arrow-right' /></svg></li>
                      <li class='action font-glyph bottom right w10' data-command='"deletePreviousChar"'>&#x232b;</li>
                  </ul>
              </div>
          </div>`,

          'func': `
            <div class='rows'>
                <ul><li class='fnbutton' data-insert='\\sin({#?})' data-latex='\\operatorname{sin}'></li>
                    <li class='fnbutton' data-insert='\\cos({#?})' data-latex='\\operatorname{cos}'></li>
                    <li class='fnbutton' data-insert='\\tan({#?})' data-latex='\\operatorname{tan}'></li>
                    <li class='fnbutton' data-insert='\\ln({#?})' data-latex='\\operatorname{ln}'></li>
                    <li class='keycap' data-insert='\\exponentialE^{#?}'></li>
                    <li class='separator w10'/>
                    <li class='separator'/>

                </ul>
                <ul><li class='fnbutton' data-insert='\\arcsin({#?})' data-latex='\\operatorname{asin}'></li>
                    <li class='fnbutton' data-insert='\\arccos({#?})' data-latex='\\operatorname{acos}'></li>
                    <li class='fnbutton' data-insert='\\arctan({#?})' data-latex='\\operatorname{atan}'></li>
                    <li class='fnbutton' data-insert='\\log_{#?}'></li>
                    <li class='keycap' data-insert='\\pi '>π</li>
                    <li class='separator w10'/>
                    <li class='separator'/>

                </ul>
                <ul>
                    <li class='keycap tex' data-alt-keys='x2' data-insert='^2'><span><i>x</i>&thinsp;²</span></li>
                    <li class='keycap tex' data-insert='^(#?)' data-latex='x^{#?}'></li>
                    <li class='keycap tex' data-alt-keys='sqrt' data-insert='\\sqrt{#0}' data-latex='\\sqrt[]{}'></li>
                    <li class='fnbutton' data-insert='\\frac{#0}{#?}' data-latex='\\frac'></li>
                    <li class='keycap tex' data-alt-keys='(' >(</li>
                    <li class='keycap tex' data-alt-keys=')' >)</li>
                    <li class='action font-glyph bottom right w10' data-command='"deleteAll"'>AC</li>
                </ul>
                <ul>
                    <li class='bigfnbutton' data-insert='\\operatorname{ceil}(#?)' data-latex='\\operatorname{ceil}()'></li>
                    <li class='bigfnbutton' data-insert='\\operatorname{floor}(#?)' data-latex='\\operatorname{floor}()'></li>
                    <li id='x2' class='keycap' data-insert='x'>x</li>
                    <style>
                          @font-face {
                              font-family: myFirstFont;
                              src: url(libraries/dist/fonts/KaTeX_Math-Italic.woff2);
                          }
                          #x2 {
                              font-family: myFirstFont;
                          }
                    </style>
                    <li class='bigfnbutton' data-insert='\\operatorname{abs}(#?)' data-latex='\\operatorname{abs}()'></li>
                    <li class='action' data-command='"moveToPreviousChar"'><svg><use xlink:href='#svg-arrow-left' /></svg></li>
                    <li class='action' data-command='"moveToNextChar"'><svg><use xlink:href='#svg-arrow-right' /></svg></li>
                    <li class='action font-glyph bottom right w10' data-command='"deletePreviousChar"'>&#x232b;</li>
                </ul>
            </div>
        </div>`,
        },
              customVirtualKeyboards: {
              'basic': {
                  label: '123',
                  tooltip: 'Standart Keyboard',
                  layer: 'four-op'
              },
              'funcs': {
                  label: 'FUNKTIONEN',
                  tooltip: 'Funktionen',
                  layer: 'func'
            },
          },
          virtualKeyboards: 'basic funcs',
      });
      // functions with math.js
      p.noLoop();
  }

  p.draw = () => {
    p.background(255);
    // xMin = Math.round(plot.getXLim()[0]*10)/10;
    // xMax = Math.round(plot.getXLim()[1]*10)/10;
    // yMin = Math.round(plot.getYLim()[0]*10)/10;
    // yMax = Math.round(plot.getYLim()[1]*10)/10;
    // deltaX = xMax - xMin;
    // deltaY = yMax - yMin;
    // //
    // plot.xAxis.setTicksSeparation(deltaX/10);
    // plot.yAxis.setTicksSeparation(deltaY/10);
    // plot.xAxis.setTicks([xMin, xMin/2, 0, xMax/2, xMax]);
    // plot.yAxis.setTicks([yMin, yMin/2, 0, yMax/2, yMax]);
    let xMouse = p.map(p.mouseX, posX, Math.round(xDim+posX), plot.getXLim()[0], plot.getXLim()[1], true)
    // Prepare the points for the plot
    // console.log(plot.xAxis.ticksPrecision);
    // console.log(plot.yAxis.ticksPrecision);
  	let points = [];
    let dPoints = [];
    let tangent = [];
  	for (let i = 0; i <= 100; i++) {
      let xSample = p.map(i, 0, 100, plot.getXLim()[0], plot.getXLim()[1])
  		points[i] = new GPoint(xSample, f.evaluate({x: xSample}));
      dPoints[i] = new GPoint(-xSample + xMouse + plot.getXLim()[0], df.evaluate({x: -xSample + xMouse + plot.getXLim()[0]}));
  	}
    for (let i = 0; i <= 1; i++) {
      let xSample = p.map(i, 0, 1, plot.getXLim()[0], plot.getXLim()[1])
      tangent[i] = new GPoint(xSample, df.evaluate({x: xMouse}) * (xSample - xMouse) + f.evaluate({x: xMouse}));
  	}
    let tangentPoint = new GPoint(xMouse ,f.evaluate({x: xMouse}), "y=f(x)");
    let tangentPoint0 = new GPoint(xMouse+1 ,f.evaluate({x: xMouse}), "0");
    let tangentPoint1 = new GPoint(xMouse+1 ,df.evaluate({x: xMouse}) + f.evaluate({x: xMouse}), "1");
    let derivativePoint = new GPoint(xMouse ,df.evaluate({x: xMouse}), "dy\n— = f'(x)\ndx")

    //plot.setPoints(points, GPlot.MAINLAYERID);
    plot.beginDraw();
    plot.drawBackground();
    plot.drawBox();
    plot.drawGridLines(GPlot.BOTH);
    plot.drawXAxis();
  	plot.drawYAxis();
    plot.drawTitle();
    plot.endDraw();

    plot.beginDraw();
    plot.drawVerticalLine(0, p.color(100), p.width*0.004);
    plot.drawHorizontalLine(0, p.color(100), p.width*0.004);
    plot.endDraw();

    plot.setPoints(points, GPlot.MAINLAYERID);
    plot.mainLayer.lineColor = p.color("#c06c84");

    plot.beginDraw();
    plot.drawLines();
    plot.endDraw();

    plot.setPoints(dPoints, GPlot.MAINLAYERID);
    plot.mainLayer.lineColor = p.color("#8ac5c3");

    plot.beginDraw();
    plot.drawLines();
    plot.endDraw();

    plot.setPoints(tangent, GPlot.MAINLAYERID);
    plot.mainLayer.lineColor = p.color(240, 160, 120);

    plot.beginDraw();
    plot.drawLines();
    plot.endDraw();

    plot.beginDraw();
    plot.drawPoint(tangentPoint, p.color("#8ac5c3"), p.width*0.007);
    plot.drawPoint(tangentPoint0, p.color(140, 250, 100), 1);
    plot.drawPoint(tangentPoint1, p.color("#8ac5c3"), 1);
    plot.drawPoint(derivativePoint, p.color("#8ac5c3"), p.width*0.007);
    plot.endDraw();

    plot.beginDraw();
    plot.drawLine(tangentPoint, tangentPoint0, p.color("#8ac5c3"), p.width*0.002);
    plot.drawLine(tangentPoint0, tangentPoint1, p.color("#8ac5c3"), p.width*0.002);
    plot.endDraw();

    let derivativePointY = p.constrain(derivativePoint.getY(), -1,0.4)
    let relPosTang1 = plot.getScreenPosAtValue(xMouse ,f.evaluate({x: xMouse}))
    let relPosTangX = plot.getScreenPosAtValue(xMouse+1 ,df.evaluate({x: xMouse}) + f.evaluate({x: xMouse}))
    p.textSize(p.width*0.025);
    p.noStroke();
    p.fill("#8ac5c3");
    p.textAlign(p.CENTER)
    p.textFont('Arial');

    if(relPosTang1[0]+p.width/25 <= (xDim + posX) && relPosTang1[1]+(p.width*0.026)*derivativePointY >=posY){
      p.text('Δx', relPosTang1[0]+p.width/25, relPosTang1[1]+(p.width*0.04)*derivativePointY);
    }
    if(relPosTang1[0]+p.width/10 <= (xDim + posX) && 0.5*(relPosTangX[1] + relPosTang1[1]) >=posY){
      p.text('Δy', relPosTang1[0]+p.width/10, 0.48*(relPosTangX[1] + relPosTang1[1]));
    }

    p.textSize(p.width/30);
    p.noStroke();
    p.fill("#c06c84");
    p.textAlign(p.LEFT, p.TOP)
    p.textFont('Arial');
    p.text('\ny = f(x) = ' + math.format(tangentPoint.getY(), 3), posX+p.width/40, posY-p.width/100);
    p.textLeading(p.width*0.015);
    p.fill("#8ac5c3");
    p.text("dy\n— = f '(x) = " + math.format(derivativePoint.getY(), 3) + "\ndx" , posX+p.width/40, posY+p.width/11);
  }
}, 'sketch');
