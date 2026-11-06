function switchTab(tabName) {
    document.querySelectorAll('.tab-content').forEach(el => el.classList.add('hidden'));
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.classList.remove('bg-blue-600', 'bg-indigo-600', 'bg-emerald-600', 'text-white', 'shadow');
        btn.classList.add('text-slate-400');
    });

    if (tabName === 'ecuaciones') {
        document.getElementById('tab-ecuaciones').classList.remove('hidden');
        document.getElementById('btn-ecuaciones').classList.add('bg-blue-600', 'text-white', 'shadow');
        document.getElementById('btn-ecuaciones').classList.remove('text-slate-400');
    } else if (tabName === 'interpolacion') {
        document.getElementById('tab-interpolacion').classList.remove('hidden');
        document.getElementById('btn-interpolacion').classList.add('bg-indigo-600', 'text-white', 'shadow');
        document.getElementById('btn-interpolacion').classList.remove('text-slate-400');
    } else if (tabName === 'integracion') {
        document.getElementById('tab-integracion').classList.remove('hidden');
        document.getElementById('btn-integracion').classList.add('bg-emerald-600', 'text-white', 'shadow');
        document.getElementById('btn-integracion').classList.remove('text-slate-400');
    }
}

window.addEventListener('DOMContentLoaded', () => {
    inicializarPuntosInterpolacion();
});

function inicializarPuntosInterpolacion() {
    const contenedor = document.getElementById('puntos-container');
    contenedor.innerHTML = '';
    const puntosIniciales = [
        {x: 0, y: 1},
        {x: 1, y: 3},
        {x: 2, y: 6},
        {x: 3, y: 12}
    ];
    puntosIniciales.forEach(p => agregarFilaPunto(p.x, p.y));
}

function agregarFilaPunto(x = 0, y = 0) {
    const contenedor = document.getElementById('puntos-container');
    const div = document.createElement('div');
    div.className = 'flex gap-2 items-center';
    div.innerHTML = `
        <input type="number" step="any" value="${x}" class="punto-x w-1/2 bg-slate-900 border border-slate-700 rounded-lg px-2 py-1 text-sm text-white" placeholder="x">
        <input type="number" step="any" value="${y}" class="punto-y w-1/2 bg-slate-900 border border-slate-700 rounded-lg px-2 py-1 text-sm text-white" placeholder="y">
        <button onclick="this.parentElement.remove()" class="text-red-400 hover:text-red-300 text-xs px-1">✕</button>
    `;
    contenedor.appendChild(div);
}

function agregarPuntoTabla() {
    agregarFilaPunto();
}

function generarPuntosDesdeFuncion() {
    try {
        const expr = document.getElementById('eq-func').value;
        const compiled = math.compile(expr);
        const contenedor = document.getElementById('puntos-container');
        contenedor.innerHTML = '';
        for (let i = 0; i <= 4; i++) {
            const xVal = i;
            const yVal = compiled.evaluate({x: xVal});
            agregarFilaPunto(xVal, Number(yVal.toFixed(4)));
        }
    } catch (e) {
        alert("Error al evaluar la función para autogenerar puntos.");
    }
}

// --- MÓDULO 1: ECUACIONES ---
function resolverEcuacion() {
    const expr = document.getElementById('eq-func').value;
    const metodo = document.getElementById('eq-method').value;
    let x0 = parseFloat(document.getElementById('eq-x0').value);
    let x1 = parseFloat(document.getElementById('eq-x1').value);
    const tol = parseFloat(document.getElementById('eq-tol').value);
    const maxIter = parseInt(document.getElementById('eq-maxiter').value);

    let compiled;
    try {
        compiled = math.compile(expr);
    } catch (e) {
        document.getElementById('eq-results').innerHTML = `<span class="text-red-400">Error en f(x): ${e.message}</span>`;
        return;
    }

    const f = (val) => compiled.evaluate({x: val});
    const df = (val) => { const h = 1e-7; return (f(val + h) - f(val - h)) / (2 * h); };
    const d2f = (val) => { const h = 1e-5; return (f(val + h) - 2 * f(val) + f(val - h)) / (h * h); };

    let iteraciones = [];
    let raizEncontrada = null;

    try {
        if (metodo === 'biseccion') {
            if (f(x0) * f(x1) >= 0) throw new Error("f(a) y f(b) deben tener signos opuestos.");
            let a = x0, b = x1, c = a;
            for (let i = 1; i <= maxIter; i++) {
                c = (a + b) / 2;
                let fc = f(c);
                let error = Math.abs(b - a) / 2;
                iteraciones.push({i, a, b, c, fc, error});
                if (Math.abs(fc) < 1e-12 || error < tol) { raizEncontrada = c; break; }
                if (f(a) * fc < 0) b = c; else a = c;
                raizEncontrada = c;
            }
        } else if (metodo === 'regla_falsa') {
            if (f(x0) * f(x1) >= 0) throw new Error("f(a) y f(b) deben tener signos opuestos.");
            let a = x0, b = x1, c = a, fc = 0;
            for (let i = 1; i <= maxIter; i++) {
                let fa = f(a), fb = f(b);
                c = b - (fb * (a - b)) / (fa - fb);
                fc = f(c);
                let error = i > 1 ? Math.abs(c - iteraciones[iteraciones.length - 1].c) : Math.abs(b - a);
                iteraciones.push({i, a, b, c, fc, error});
                if (Math.abs(fc) < 1e-12 || error < tol) { raizEncontrada = c; break; }
                if (f(a) * fc < 0) b = c; else a = c;
                raizEncontrada = c;
            }
        } else if (metodo === 'secante') {
            let x_prev = x0, x_curr = x1;
            for (let i = 1; i <= maxIter; i++) {
                let f_prev = f(x_prev), f_curr = f(x_curr);
                if (f_curr - f_prev === 0) throw new Error("División por cero en secante.");
                let x_next = x_curr - (f_curr * (x_prev - x_curr)) / (f_prev - f_curr);
                let error = Math.abs(x_next - x_curr);
                iteraciones.push({i, x: x_next, fx: f(x_next), error});
                if (error < tol || Math.abs(f(x_next)) < 1e-12) { raizEncontrada = x_next; break; }
                x_prev = x_curr; x_curr = x_next;
                raizEncontrada = x_next;
            }
        } else if (metodo === 'newton') {
            let x = x0;
            for (let i = 1; i <= maxIter; i++) {
                let fx = f(x), dfx = df(x);
                if (Math.abs(dfx) < 1e-12) throw new Error("Derivada cercana a cero.");
                let x_next = x - fx / dfx;
                let error = Math.abs(x_next - x);
                iteraciones.push({i, x: x_next, fx: f(x_next), error});
                if (error < tol || Math.abs(fx) < 1e-12) { raizEncontrada = x_next; break; }
                x = x_next; raizEncontrada = x_next;
            }
        } else if (metodo === 'newton_mod') {
            let x = x0;
            for (let i = 1; i <= maxIter; i++) {
                let fx = f(x), dfx = df(x), d2fx = d2f(x);
                let denom = (dfx * dfx) - (fx * d2fx);
                if (Math.abs(denom) < 1e-12) throw new Error("Denominador cero en Newton Modificado.");
                let x_next = x - (fx * dfx) / denom;
                let error = Math.abs(x_next - x);
                iteraciones.push({i, x: x_next, fx: f(x_next), error});
                if (error < tol || Math.abs(fx) < 1e-12) { raizEncontrada = x_next; break; }
                x = x_next; raizEncontrada = x_next;
            }
        }

        let html = `<p class="text-emerald-400 font-semibold mb-2">Raíz aproximada: x = ${raizEncontrada.toFixed(6)}</p>`;
        html += `<table class="w-full text-left border-collapse text-xs"><tr class="border-b border-slate-700 text-slate-400">`;
        if (metodo === 'biseccion' || metodo === 'regla_falsa') {
            html += `<th class="py-2 px-2">Iter</th><th class="py-2 px-2">a</th><th class="py-2 px-2">b</th><th class="py-2 px-2">c</th><th class="py-2 px-2">f(c)</th><th class="py-2 px-2">Error</th></tr>`;
            iteraciones.forEach(it => {
                html += `<tr class="border-b border-slate-700/50 hover:bg-slate-700/30">
                    <td class="py-1 px-2">${it.i}</td><td class="py-1 px-2">${it.a.toFixed(5)}</td><td class="py-1 px-2">${it.b.toFixed(5)}</td>
                    <td class="py-1 px-2 font-bold text-blue-400">${it.c.toFixed(5)}</td><td class="py-1 px-2">${it.fc.toExponential(4)}</td><td class="py-1 px-2">${it.error.toExponential(4)}</td></tr>`;
            });
        } else {
            html += `<th class="py-2 px-2">Iter</th><th class="py-2 px-2">x_i</th><th class="py-2 px-2">f(x_i)</th><th class="py-2 px-2">Error</th></tr>`;
            iteraciones.forEach(it => {
                html += `<tr class="border-b border-slate-700/50 hover:bg-slate-700/30">
                    <td class="py-1 px-2">${it.i}</td><td class="py-1 px-2 font-bold text-blue-400">${it.x.toFixed(6)}</td>
                    <td class="py-1 px-2">${it.fx.toExponential(4)}</td><td class="py-1 px-2">${it.error.toExponential(4)}</td></tr>`;
            });
        }
        html += `</table>`;
        document.getElementById('eq-results').innerHTML = html;

        let xVals = [], yVals = [];
        let xMin = raizEncontrada - 3, xMax = raizEncontrada + 3;
        for (let x = xMin; x <= xMax; x += (xMax - xMin) / 100) {
            xVals.push(x); yVals.push(f(x));
        }
        Plotly.newPlot('eq-plot', [{
            x: xVals, y: yVals, type: 'scatter', mode: 'lines', name: 'f(x)', line: {color: '#60a5fa', width: 2}
        }, {
            x: [raizEncontrada], y: [f(raizEncontrada)], type: 'scatter', mode: 'markers', name: 'Raíz', marker: {color: '#34d399', size: 10}
        }], {
            paper_bgcolor: 'transparent', plot_bgcolor: 'transparent', font: {color: '#f8fafc', size: 11},
            margin: {t: 20, r: 20, b: 30, l: 40}, xaxis: {gridcolor: '#334155'}, yaxis: {gridcolor: '#334155'}
        }, {responsive: true});

    } catch (err) {
        document.getElementById('eq-results').innerHTML = `<span class="text-red-400">Error: ${err.message}</span>`;
    }
}

// --- MÓDULO 2: INTERPOLACIÓN (Con Validación de Espaciamiento h) ---
function calcularInterpolacion() {
    const metodo = document.getElementById('interp-method').value;
    const xEval = parseFloat(document.getElementById('interp-xval').value);
    
    let xArr = [], yArr = [];
    document.querySelectorAll('#puntos-container > div').forEach(div => {
        const inputs = div.querySelectorAll('input');
        xArr.push(parseFloat(inputs[0].value));
        yArr.push(parseFloat(inputs[1].value));
    });

    if (xArr.length < 2) {
        alert("Ingresa al menos 2 puntos.");
        return;
    }

    let n = xArr.length;
    let yEval = 0;
    let htmlResultado = "";

    // Validación de h constante para Diferencias Finitas
    if (metodo === 'fin_progresivas' || metodo === 'fin_regresivas') {
        let hRef = xArr[1] - xArr[0];
        for (let i = 0; i < n - 1; i++) {
            let hActual = xArr[i+1] - xArr[i];
            if (Math.abs(hActual - hRef) > 1e-5) {
                document.getElementById('interp-results').innerHTML = `
                    <div class="bg-red-500/20 border border-red-500 text-red-300 p-3 rounded-lg text-xs">
                        <strong>⚠️ Advertencia de Requisito:</strong> El método de Diferencias Finitas requiere que el espaciamiento h sea estrictamente igual en todos los puntos.<br>
                    </div>`;
                return;
            }
        }
    }

    if (metodo === 'fin_progresivas') {
        let h = xArr[1] - xArr[0];
        let tabla = Array(n).fill(0).map(() => Array(n).fill(0));
        for (let i = 0; i < n; i++) tabla[i][0] = yArr[i];

        for (let j = 1; j < n; j++) {
            for (let i = 0; i < n - j; i++) {
                tabla[i][j] = tabla[i+1][j-1] - tabla[i][j-1];
            }
        }

        let x0 = xArr[0];
        let s = (xEval - x0) / h;
        yEval = tabla[0][0];
        let termProd = 1, factorial = 1;

        for (let j = 1; j < n; j++) {
            termProd *= (s - (j - 1));
            factorial *= j;
            yEval += (termProd * tabla[0][j]) / factorial;
        }

        htmlResultado = `<p class="text-indigo-400 font-semibold mb-2">Interpolación Finitas Progresivas P(${xEval}) = ${yEval.toFixed(6)}</p>`;
        htmlResultado += `<p class="text-xs text-slate-400 mb-1">Paso h = ${h.toFixed(4)} (Constante Válido), s = ${s.toFixed(4)}</p>`;
        htmlResultado += `<table class="w-full text-left border-collapse text-xs overflow-x-auto">
            <tr class="border-b border-slate-700 text-slate-400">
                <th class="py-1 px-2">x_i</th><th class="py-1 px-2">y_i</th>`;
        for(let j=1; j<n; j++) htmlResultado += `<th class="py-1 px-2">Δ^${j}y</th>`;
        htmlResultado += `</tr>`;

        for(let i=0; i<n; i++) {
            htmlResultado += `<tr class="border-b border-slate-700/50"><td class="py-1 px-2">${xArr[i]}</td><td class="py-1 px-2">${yArr[i]}</td>`;
            for(let j=1; j<n-i; j++) htmlResultado += `<td class="py-1 px-2">${tabla[i][j].toFixed(4)}</td>`;
            htmlResultado += `</tr>`;
        }
        htmlResultado += `</table>`;

    } else if (metodo === 'fin_regresivas') {
        let h = xArr[1] - xArr[0];
        let tabla = Array(n).fill(0).map(() => Array(n).fill(0));
        for (let i = 0; i < n; i++) tabla[i][0] = yArr[i];

        for (let j = 1; j < n; j++) {
            for (let i = n - 1; i >= j; i--) {
                tabla[i][j] = tabla[i][j-1] - tabla[i-1][j-1];
            }
        }

        let xn = xArr[n - 1];
        let s = (xEval - xn) / h;
        yEval = tabla[n - 1][0];
        let termProd = 1, factorial = 1;

        for (let j = 1; j < n; j++) {
            termProd *= (s + (j - 1));
            factorial *= j;
            yEval += (termProd * tabla[n - 1][j]) / factorial;
        }

        htmlResultado = `<p class="text-indigo-400 font-semibold mb-2">Interpolación Finitas Regresivas P(${xEval}) = ${yEval.toFixed(6)}</p>`;
        htmlResultado += `<p class="text-xs text-slate-400 mb-1">Paso h = ${h.toFixed(4)} (Constante Válido), s = ${s.toFixed(4)}</p>`;
        htmlResultado += `<table class="w-full text-left border-collapse text-xs overflow-x-auto">
            <tr class="border-b border-slate-700 text-slate-400">
                <th class="py-1 px-2">x_i</th><th class="py-1 px-2">y_i</th>`;
        for(let j=1; j<n; j++) htmlResultado += `<th class="py-1 px-2">∇^${j}y</th>`;
        htmlResultado += `</tr>`;

        for(let i=0; i<n; i++) {
            htmlResultado += `<tr class="border-b border-slate-700/50"><td class="py-1 px-2">${xArr[i]}</td><td class="py-1 px-2">${yArr[i]}</td>`;
            for(let j=1; j<=i; j++) htmlResultado += `<td class="py-1 px-2">${tabla[i][j].toFixed(4)}</td>`;
            htmlResultado += `</tr>`;
        }
        htmlResultado += `</table>`;

    } else if (metodo === 'newton_div') {
        let tabla = Array(n).fill(0).map(() => Array(n).fill(0));
        for (let i = 0; i < n; i++) tabla[i][0] = yArr[i];

        for (let j = 1; j < n; j++) {
            for (let i = 0; i < n - j; i++) {
                tabla[i][j] = (tabla[i+1][j-1] - tabla[i][j-1]) / (xArr[i+j] - xArr[i]);
            }
        }
        yEval = tabla[0][0];
        let productoTerm = 1;
        for (let j = 1; j < n; j++) {
            productoTerm *= (xEval - xArr[j-1]);
            yEval += tabla[0][j] * productoTerm;
        }

        htmlResultado = `<p class="text-indigo-400 font-semibold mb-2">Newton Diferencias Divididas P(${xEval}) = ${yEval.toFixed(6)}</p>`;
        htmlResultado += `<table class="w-full text-left border-collapse text-xs overflow-x-auto">
            <tr class="border-b border-slate-700 text-slate-400">
                <th class="py-1 px-2">x_i</th><th class="py-1 px-2">f[x_i]</th>`;
        for(let j=1; j<n; j++) htmlResultado += `<th class="py-1 px-2">Orden ${j}</th>`;
        htmlResultado += `</tr>`;

        for(let i=0; i<n; i++) {
            htmlResultado += `<tr class="border-b border-slate-700/50"><td class="py-1 px-2">${xArr[i]}</td>`;
            for(let j=0; j<n-i; j++) htmlResultado += `<td class="py-1 px-2">${tabla[i][j].toFixed(4)}</td>`;
            htmlResultado += `</tr>`;
        }
        htmlResultado += `</table>`;

    } else if (metodo === 'lagrange') {
        let tablaLagrange = [];
        yEval = 0;

        for (let i = 0; i < n; i++) {
            let L_i = 1;
            for (let j = 0; j < n; j++) {
                if (i !== j) L_i *= (xEval - xArr[j]) / (xArr[i] - xArr[j]);
            }
            let contribucion = yArr[i] * L_i;
            yEval += contribucion;
            tablaLagrange.push({ i, x: xArr[i], y: yArr[i], Li: L_i, contrib: contribucion });
        }

        htmlResultado = `<p class="text-indigo-400 font-semibold mb-2">Polinomio de Lagrange P(${xEval}) = ${yEval.toFixed(6)}</p>`;
        htmlResultado += `<table class="w-full text-left border-collapse text-xs">
            <tr class="border-b border-slate-700 text-slate-400">
                <th class="py-1 px-2">i</th><th class="py-1 px-2">x_i</th><th class="py-1 px-2">y_i</th><th class="py-1 px-2">L_i(x*)</th><th class="py-1 px-2">y_i · L_i(x*)</th>
            </tr>`;
        tablaLagrange.forEach(row => {
            htmlResultado += `<tr class="border-b border-slate-700/50 hover:bg-slate-700/30">
                <td class="py-1 px-2">${row.i}</td><td class="py-1 px-2">${row.x}</td><td class="py-1 px-2">${row.y}</td>
                <td class="py-1 px-2">${row.Li.toFixed(5)}</td><td class="py-1 px-2 font-bold text-indigo-300">${row.contrib.toFixed(5)}</td>
            </tr>`;
        });
        htmlResultado += `</table>`;
    }

    document.getElementById('interp-results').innerHTML = htmlResultado;

    Plotly.newPlot('interp-plot', [{
        x: xArr, y: yArr, type: 'scatter', mode: 'markers', name: 'Puntos dados', marker: {color: '#818cf8', size: 10}
    }, {
        x: [xEval], y: [yEval], type: 'scatter', mode: 'markers', name: 'Evaluado', marker: {color: '#f43f5e', size: 12}
    }], {
        paper_bgcolor: 'transparent', plot_bgcolor: 'transparent', font: {color: '#f8fafc', size: 11},
        margin: {t: 20, r: 20, b: 30, l: 40}, xaxis: {gridcolor: '#334155'}, yaxis: {gridcolor: '#334155'}
    }, {responsive: true});
}

// --- MÓDULO 3: INTEGRACIÓN (Con Validaciones de n para Simpson) ---
function calcularIntegracion() {
    const tipo = document.getElementById('int-tipo').value;
    
    if (tipo === '1d') {
        const expr = document.getElementById('int-func').value;
        const metodo = document.getElementById('int-method').value;
        const a = parseFloat(document.getElementById('int-a').value);
        const b = parseFloat(document.getElementById('int-b').value);
        const n = parseInt(document.getElementById('int-n').value);

        // Validaciones de requisitos para Simpson
        if (metodo === 'simpson13' && n % 2 !== 0) {
            document.getElementById('int-results').innerHTML = `
                <div class="bg-red-500/20 border border-red-500 text-red-300 p-3 rounded-lg text-xs">
                    <strong>⚠️ Requisito no cumplido:</strong> La regla de <strong>Simpson 1/3</strong> exige obligatoriamente que el número de intervalos <em>n</em> sea un número <strong>par</strong> (actualmente n = ${n}). Cambia n a un valor par.
                </div>`;
            return;
        }

        if (metodo === 'simpson38' && n % 3 !== 0) {
            document.getElementById('int-results').innerHTML = `
                <div class="bg-red-500/20 border border-red-500 text-red-300 p-3 rounded-lg text-xs">
                    <strong>⚠️ Requisito no cumplido:</strong> La regla de <strong>Simpson 3/8</strong> exige obligatoriamente que el número de intervalos <em>n</em> sea un <strong>múltiplo de 3</strong> (actualmente n = ${n}). Cambia n a un múltiplo de 3 (ej. 3, 6, 9).
                </div>`;
            return;
        }

        let compiled;
        try {
            compiled = math.compile(expr);
        } catch (e) {
            document.getElementById('int-results').innerHTML = `<span class="text-red-400">Error en f(x): ${e.message}</span>`;
            return;
        }
        const f = (val) => compiled.evaluate({x: val});

        let resultado = 0;
        let h = (b - a) / n;
        let tablaSubintervalos = [];

        if (metodo === 'trapecio') {
            let suma = f(a) + f(b);
            tablaSubintervalos.push({i: 0, x: a, fx: f(a), coef: 1});
            for (let i = 1; i < n; i++) {
                let xi = a + i * h;
                let fxi = f(xi);
                suma += 2 * fxi;
                tablaSubintervalos.push({i, x: xi, fx: fxi, coef: 2});
            }
            tablaSubintervalos.push({i: n, x: b, fx: f(b), coef: 1});
            resultado = (h / 2) * suma;

        } else if (metodo === 'simpson13') {
            let suma = f(a) + f(b);
            tablaSubintervalos.push({i: 0, x: a, fx: f(a), coef: 1});
            for (let i = 1; i < n; i++) {
                let xi = a + i * h;
                let fxi = f(xi);
                let c = (i % 2 === 0 ? 2 : 4);
                suma += c * fxi;
                tablaSubintervalos.push({i, x: xi, fx: fxi, coef: c});
            }
            tablaSubintervalos.push({i: n, x: b, fx: f(b), coef: 1});
            resultado = (h / 3) * suma;

        } else if (metodo === 'simpson38') {
            let suma = f(a) + f(b);
            tablaSubintervalos.push({i: 0, x: a, fx: f(a), coef: 1});
            for (let i = 1; i < n; i++) {
                let xi = a + i * h;
                let fxi = f(xi);
                let c = (i % 3 === 0 ? 2 : 3);
                suma += c * fxi;
                tablaSubintervalos.push({i, x: xi, fx: fxi, coef: c});
            }
            tablaSubintervalos.push({i: n, x: b, fx: f(b), coef: 1});
            resultado = ((3 * h) / 8) * suma;

        } else if (metodo === 'gauss1d') {
            let c1 = 1, c2 = 1;
            let x1 = -0.5773502692, x2 = 0.5773502692;
            let t1 = ((b - a) * x1 + (b + a)) / 2;
            let t2 = ((b - a) * x2 + (b + a)) / 2;
            resultado = ((b - a) / 2) * (c1 * f(t1) + c2 * f(t2));
            tablaSubintervalos = [
                {i: 1, x: t1, fx: f(t1), coef: c1},
                {i: 2, x: t2, fx: f(t2), coef: c2}
            ];
        }

        let htmlRes = `<p class="text-emerald-400 font-semibold mb-2">Resultado Integral 1D = ${resultado.toFixed(6)}</p>`;
        htmlRes += `<table class="w-full text-left border-collapse text-xs">
            <tr class="border-b border-slate-700 text-slate-400">
                <th class="py-1 px-2">i</th><th class="py-1 px-2">x_i</th><th class="py-1 px-2">f(x_i)</th><th class="py-1 px-2">Coeficiente</th>
            </tr>`;
        tablaSubintervalos.forEach(row => {
            htmlRes += `<tr class="border-b border-slate-700/50">
                <td class="py-1 px-2">${row.i}</td><td class="py-1 px-2">${row.x.toFixed(4)}</td><td class="py-1 px-2">${row.fx.toFixed(4)}</td><td class="py-1 px-2 font-bold text-emerald-300">${row.coef}</td>
            </tr>`;
        });
        htmlRes += `</table>`;
        document.getElementById('int-results').innerHTML = htmlRes;

        let xVals = [], yVals = [];
        for (let x = a; x <= b; x += (b - a) / 50) {
            xVals.push(x); yVals.push(f(x));
        }
        Plotly.newPlot('int-plot', [{
            x: xVals, y: yVals, type: 'scatter', mode: 'lines', fill: 'tozeroy', name: 'f(x)', line: {color: '#34d399'}
        }], {
            paper_bgcolor: 'transparent', plot_bgcolor: 'transparent', font: {color: '#f8fafc', size: 11},
            margin: {t: 20, r: 20, b: 30, l: 40}, xaxis: {gridcolor: '#334155'}, yaxis: {gridcolor: '#334155'}
        }, {responsive: true});

    } else {
        const expr = document.getElementById('int2d-func').value;
        const ax = parseFloat(document.getElementById('int2d-ax').value);
        const bx = parseFloat(document.getElementById('int2d-bx').value);
        const cy = parseFloat(document.getElementById('int2d-cy').value);
        const dy = parseFloat(document.getElementById('int2d-dy').value);
        const numPuntos = parseInt(document.getElementById('int2d-puntos').value);

        let compiled;
        try {
            compiled = math.compile(expr);
        } catch (e) {
            document.getElementById('int-results').innerHTML = `<span class="text-red-400">Error: ${e.message}</span>`;
            return;
        }
        const f = (x, y) => compiled.evaluate({x: x, y: y});

        let nodos = [], pesos = [];
        if (numPuntos === 2) {
            nodos = [-0.5773502692, 0.5773502692];
            pesos = [1.0, 1.0];
        } else {
            nodos = [-0.7745966692, 0.0, 0.7745966692];
            pesos = [0.5555555556, 0.8888888889, 0.5555555556];
        }

        let sumaIntegral = 0;
        let wx = (bx - ax) / 2, mx = (bx + ax) / 2;
        let wy = (dy - cy) / 2, my = (dy + cy) / 2;
        let tablaGauss2D = [];

        for (let i = 0; i < numPuntos; i++) {
            for (let j = 0; j < numPuntos; j++) {
                let u_i = nodos[i];
                let u_j = nodos[j];
                let xi = wx * u_i + mx;
                let xj = wy * u_j + my;
                let Ci = pesos[i];
                let Cj = pesos[j];
                let valFunc = f(xi, xj);
                let productoPonderado = Ci * Cj * valFunc;
                
                sumaIntegral += productoPonderado;

                tablaGauss2D.push({
                    indice: `(${i+1}, ${j+1})`,
                    pesosTabla: `C_i=${Ci.toFixed(4)}, C_j=${Cj.toFixed(4)}<br><span class="text-slate-500">nodos: u_i=${u_i.toFixed(3)}, u_j=${u_j.toFixed(3)}</span>`,
                    funcionEval: `f(${xi.toFixed(3)}, ${xj.toFixed(3)}) = ${valFunc.toFixed(4)}`,
                    multiplicacion: productoPonderado.toFixed(4)
                });
            }
        }
        let resultado2D = wx * wy * sumaIntegral;

        let htmlRes = `<p class="text-emerald-400 font-semibold mb-2">Resultado Integral Doble (Gauss 2D) = ${resultado2D.toFixed(6)}</p>`;
        htmlRes += `<table class="w-full text-left border-collapse text-xs">
            <tr class="border-b border-slate-700 text-slate-400">
                <th class="py-1 px-2">i, j</th>
                <th class="py-1 px-2">Pesos y Nodos (Tabla)</th>
                <th class="py-1 px-2">f(x_i, x_j) [x_i, x_j mapeados]</th>
                <th class="py-1 px-2">C_i · C_j · f(x_i, x_j)</th>
            </tr>`;
        tablaGauss2D.forEach(row => {
            htmlRes += `<tr class="border-b border-slate-700/50 hover:bg-slate-700/30">
                <td class="py-1 px-2 font-bold text-blue-300">${row.indice}</td>
                <td class="py-1 px-2">${row.pesosTabla}</td>
                <td class="py-1 px-2">${row.funcionEval}</td>
                <td class="py-1 px-2 font-bold text-emerald-300">${row.multiplicacion}</td>
            </tr>`;
        });
        htmlRes += `</table>`;
        document.getElementById('int-results').innerHTML = htmlRes;

        Plotly.newPlot('int-plot', [{
            z: [[f(ax,cy), f(bx,cy)], [f(ax,dy), f(bx,dy)]], type: 'surface'
        }], {
            paper_bgcolor: 'transparent', plot_bgcolor: 'transparent', font: {color: '#f8fafc', size: 11},
            margin: {t: 20, r: 20, b: 30, l: 40}
        }, {responsive: true});
    }
}