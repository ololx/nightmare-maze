class WebGL2DAdapter {
    constructor(gl) {
        this.gl = gl;
        this.program = null;
        this.positionBuffer = null;
        this.texCoordBuffer = null;
        this.currentTexture = null;
        this.fillStyle = "#000000"; // По умолчанию черный цвет
        this.font = "10px sans-serif"; // Шрифт по умолчанию
        this.init();
    }

    init() {
        // Вершинный и фрагментный шейдеры
        const vertexShaderSource = `
            attribute vec2 a_position;
            attribute vec2 a_texCoord;
            varying vec2 v_texCoord;
            void main() {
                gl_Position = vec4(a_position, 0, 1);
                v_texCoord = a_texCoord;
            }
        `;

        const fragmentShaderSource = `
            precision mediump float;
            varying vec2 v_texCoord;
            uniform sampler2D u_texture;
            uniform vec4 u_color;
            uniform bool u_useTexture;  // Флаг для использования текстуры
        
            void main() {
                if (u_useTexture) {
                    gl_FragColor = texture2D(u_texture, v_texCoord);
                } else {
                    gl_FragColor = u_color;
                }
            }
        `;

        // Компиляция и создание шейдеров
        const vertexShader = this.createShader(this.gl.VERTEX_SHADER, vertexShaderSource);
        const fragmentShader = this.createShader(this.gl.FRAGMENT_SHADER, fragmentShaderSource);

        // Создание программы
        this.program = this.createProgram(vertexShader, fragmentShader);
        this.gl.useProgram(this.program);

        // Создание буферов
        this.positionBuffer = this.gl.createBuffer();
        this.texCoordBuffer = this.gl.createBuffer();

        // Связывание атрибутов
        const positionLocation = this.gl.getAttribLocation(this.program, "a_position");
        const texCoordLocation = this.gl.getAttribLocation(this.program, "a_texCoord");

        // Включаем атрибуты вершин и текстур
        this.gl.enableVertexAttribArray(positionLocation);
        this.gl.enableVertexAttribArray(texCoordLocation);

        // Устанавливаем начальные буферы
        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.positionBuffer);
        this.gl.vertexAttribPointer(positionLocation, 2, this.gl.FLOAT, false, 0, 0);

        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.texCoordBuffer);
        this.gl.vertexAttribPointer(texCoordLocation, 2, this.gl.FLOAT, false, 0, 0);
    }

    createShader(type, source) {
        const shader = this.gl.createShader(type);
        this.gl.shaderSource(shader, source);
        this.gl.compileShader(shader);
        if (!this.gl.getShaderParameter(shader, this.gl.COMPILE_STATUS)) {
            console.error(this.gl.getShaderInfoLog(shader));
            this.gl.deleteShader(shader);
            return null;
        }
        return shader;
    }

    createProgram(vertexShader, fragmentShader) {
        const program = this.gl.createProgram();
        this.gl.attachShader(program, vertexShader);
        this.gl.attachShader(program, fragmentShader);
        this.gl.linkProgram(program);
        if (!this.gl.getProgramParameter(program, this.gl.LINK_STATUS)) {
            console.error(this.gl.getProgramInfoLog(program));
            return null;
        }
        return program;
    }

    clearRect(x, y, width, height) {
        this.fillRect(x, y, width, height, true);
    }

    fillRect(x, y, width, height, isClear = false) {
        // Преобразование координат в нормализованные (от -1 до 1)
        const normalizedX1 = (x / this.gl.canvas.width) * 2 - 1;
        const normalizedY1 = (y / this.gl.canvas.height) * -2 + 1;
        const normalizedX2 = ((x + width) / this.gl.canvas.width) * 2 - 1;
        const normalizedY2 = ((y + height) / this.gl.canvas.height) * -2 + 1;

        // Массив с 4 вершинами (x, y) для TRIANGLE_STRIP
        const positions = new Float32Array([
            normalizedX1, normalizedY1, // Левый нижний
            normalizedX2, normalizedY1, // Правый нижний
            normalizedX1, normalizedY2, // Левый верхний
            normalizedX2, normalizedY2, // Правый верхний
        ]);

        // Заполняем буфер вершин
        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.positionBuffer);
        this.gl.bufferData(this.gl.ARRAY_BUFFER, positions, this.gl.STATIC_DRAW);

        // Если это clearRect, используем цвет по умолчанию (чёрный)
        const color = isClear ? [0, 0, 0, 1] : this.hexToRgb(this.fillStyle);

        // Устанавливаем цвет заливки
        const uColorLocation = this.gl.getUniformLocation(this.program, "u_color");
        this.gl.uniform4fv(uColorLocation, color);

        // Передаем флаг, что текстуру не нужно использовать
        const uUseTextureLocation = this.gl.getUniformLocation(this.program, "u_useTexture");
        this.gl.uniform1i(uUseTextureLocation, false);  // Используем только цвет

        // Убедитесь, что перед вызовом рисования указаны атрибуты
        const positionLocation = this.gl.getAttribLocation(this.program, "a_position");
        this.gl.vertexAttribPointer(positionLocation, 2, this.gl.FLOAT, false, 0, 0);
        this.gl.enableVertexAttribArray(positionLocation);

        // Выполняем отрисовку
        this.gl.drawArrays(this.gl.TRIANGLE_STRIP, 0, 4);  // Рисуем 4 вершины
    }

    drawImage(image, sx, sy, sWidth, sHeight, dx, dy, dWidth, dHeight) {
        // Загрузка текстуры
        if (this.currentTexture !== image) {
            this.currentTexture = this.gl.createTexture();
            this.gl.bindTexture(this.gl.TEXTURE_2D, this.currentTexture);
            this.gl.texImage2D(this.gl.TEXTURE_2D, 0, this.gl.RGBA, this.gl.RGBA, this.gl.UNSIGNED_BYTE, image);

            this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_WRAP_S, this.gl.CLAMP_TO_EDGE);
            this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_WRAP_T, this.gl.CLAMP_TO_EDGE);
            this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_MIN_FILTER, this.gl.LINEAR);
            this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_MAG_FILTER, this.gl.LINEAR);
        }

        // Устанавливаем текстурные координаты
        const texLeft = sx / image.width;
        const texRight = (sx + sWidth) / image.width;
        const texTop = sy / image.height;
        const texBottom = (sy + sHeight) / image.height;

        const texCoords = new Float32Array([
            texLeft, texBottom,
            texRight, texBottom,
            texLeft, texTop,
            texRight, texTop,
        ]);

        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.texCoordBuffer);
        this.gl.bufferData(this.gl.ARRAY_BUFFER, texCoords, this.gl.STATIC_DRAW);

        // Устанавливаем координаты вершин для отрисовки
        const x1 = (dx / this.gl.canvas.width) * 2 - 1;
        const y1 = (dy / this.gl.canvas.height) * -2 + 1;
        const x2 = ((dx + dWidth) / this.gl.canvas.width) * 2 - 1;
        const y2 = ((dy + dHeight) / this.gl.canvas.height) * -2 + 1;

        const positions = new Float32Array([
            x1, y1,  // Левый нижний
            x2, y1,  // Правый нижний
            x1, y2,  // Левый верхний
            x2, y2,  // Правый верхний
        ]);

        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.positionBuffer);
        this.gl.bufferData(this.gl.ARRAY_BUFFER, positions, this.gl.STATIC_DRAW);

        // Передаем флаг, что текстуру нужно использовать
        const uUseTextureLocation = this.gl.getUniformLocation(this.program, "u_useTexture");
        this.gl.uniform1i(uUseTextureLocation, true);  // Используем текстуру

        // Убедитесь, что перед вызовом рисования указаны атрибуты
        const positionLocation = this.gl.getAttribLocation(this.program, "a_position");
        const texCoordLocation = this.gl.getAttribLocation(this.program, "a_texCoord");

        this.gl.vertexAttribPointer(positionLocation, 2, this.gl.FLOAT, false, 0, 0);
        this.gl.vertexAttribPointer(texCoordLocation, 2, this.gl.FLOAT, false, 0, 0);
        this.gl.enableVertexAttribArray(positionLocation);
        this.gl.enableVertexAttribArray(texCoordLocation);

        // Проверка данных в буфере перед отрисовкой
        console.log("Positions buffer length:", positions.length);
        console.log("TexCoords buffer length:", texCoords.length);

        // Выполняем отрисовку
        this.gl.drawArrays(this.gl.TRIANGLE_STRIP, 0, 4);  // Рисуем 4 вершины
    }

    fillText(text, x, y) {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');

        // Настройка шрифта и цвета
        canvas.width = 512; // Можно динамически вычислять размеры
        canvas.height = 512;
        ctx.font = this.font;
        ctx.fillStyle = this.fillStyle;
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(text, canvas.width / 2, canvas.height / 2);

        // Загрузка текста как текстуры
        const texture = this.gl.createTexture();
        this.gl.bindTexture(this.gl.TEXTURE_2D, texture);
        this.gl.texImage2D(this.gl.TEXTURE_2D, 0, this.gl.RGBA, this.gl.RGBA, this.gl.UNSIGNED_BYTE, canvas);
        this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_WRAP_S, this.gl.CLAMP_TO_EDGE);
        this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_WRAP_T, this.gl.CLAMP_TO_EDGE);
        this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_MIN_FILTER, this.gl.LINEAR);

        // Преобразование координат для отрисовки текста
        const positions = new Float32Array([
            -1, -1,
            1, -1,
            -1, 1,
            1, 1,
        ]);

        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.positionBuffer);
        this.gl.bufferData(this.gl.ARRAY_BUFFER, positions, this.gl.STATIC_DRAW);

        const uTextureLocation = this.gl.getUniformLocation(this.program, "u_texture");
        this.gl.uniform1i(uTextureLocation, 1);

        // Убедитесь, что перед вызовом рисования указаны атрибуты
        const positionLocation = this.gl.getAttribLocation(this.program, "a_position");
        this.gl.vertexAttribPointer(positionLocation, 2, this.gl.FLOAT, false, 0, 0);
        this.gl.enableVertexAttribArray(positionLocation);

        // Выполняем отрисовку
        this.gl.drawArrays(this.gl.TRIANGLE_STRIP, 0, 4);
    }

    hexToRgb(hex) {
        const bigint = parseInt(hex.replace("#", ""), 16);
        const r = (bigint >> 16) & 255;
        const g = (bigint >> 8) & 255;
        const b = bigint & 255;
        return [r / 255, g / 255, b / 255, 1];
    }
}
