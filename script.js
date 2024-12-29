/***********************************************
 * Variables relacionadas con los resúmenes y audio
 ***********************************************/
const btnResumen = document.getElementById("btnResumen");
const btnAudio = document.getElementById("btnAudio");

// Modal para el resumen
const modalResumen = document.getElementById("modalResumen");
const modalCerrar = document.getElementById("modalCerrar");
const resumenContent = document.getElementById("resumenContent");

/***************************************************
 * Función para obtener la URL del resumen .md      *
 * según el curso seleccionado                     *
 ***************************************************/
function obtenerUrlResumen(curso) {
  // Por ejemplo, si cada curso tiene un fichero: curso1-resumen.md, curso2-resumen.md, etc.
  return `${curso}-resumen.md`;
}

/***************************************************
 * Función para obtener la URL de audio             *
 * según el curso seleccionado                     *
 ***************************************************/
function obtenerUrlAudio(curso) {
  // Ejemplo: si cada curso tiene una URL de audio distinta
  // Podrías guardarlas en un objeto o generarlas de forma dinámica
  const audioURLs = {
    "preguntas_hs": "https://notebooklm.google.com/notebook/05ff2800-de6e-4a4d-a944-f8577b1e5d53/audio",
    "preguntas_pa": "https://notebooklm.google.com/notebook/fb87f00b-2f24-4ffd-a739-4ff65a8035c5/audio",
    "preguntas_i": "https://notebooklm.google.com/notebook/0a728bb9-89f1-4589-b32c-13b167e22e6b/audio",
    "preguntas_d": "https://notebooklm.google.com/notebook/483f19de-f081-41ed-bf15-2ce968f30273/audio",
    "preguntas_a": "https://notebooklm.google.com/notebook/e6f4ad4f-bdca-4493-93e4-6368e6adcfab/audio"
  };

  return audioURLs[curso] || "#"; // fallback
}

/***************************************************
 * Función para mostrar el modal del resumen        *
 ***************************************************/
function mostrarModalResumen() {
  modalResumen.style.display = "block";
}

/***************************************************
 * Función para ocultar el modal del resumen        *
 ***************************************************/
function ocultarModalResumen() {
  modalResumen.style.display = "none";
}

/*********************************************************
 * Función para cargar y mostrar el resumen en formato MD *
 *********************************************************/
async function cargarResumen() {
  // Tomamos el curso seleccionado
  const cursoSeleccionado = selectCurso.value;
  const urlMD = obtenerUrlResumen(cursoSeleccionado);

  try {
    // Cargamos el contenido MD
    const resp = await fetch(urlMD);
    if (!resp.ok) throw new Error("No se pudo cargar el resumen .md");

    const mdContent = await resp.text(); // Contenido en texto

    // Convertir a HTML usando la librería 'marked'
    const htmlContent = marked.parse(mdContent);

    // Inyectamos el HTML en el modal
    resumenContent.innerHTML = htmlContent;

    // Mostramos el modal
    mostrarModalResumen();
  } catch (err) {
    console.error(err);
    alert("Ocurrió un error al cargar el resumen.");
  }
}

/***************************************************
 * Manejador para el botón "Ver Resumen"
 ***************************************************/
btnResumen.addEventListener("click", cargarResumen);

/***************************************************
 * Manejador para el botón "Escuchar Audio"
 * Abre la URL en otra pestaña (target=_blank)
 ***************************************************/
btnAudio.addEventListener("click", () => {
  const cursoSeleccionado = selectCurso.value;
  const audioUrl = obtenerUrlAudio(cursoSeleccionado);
  if (audioUrl === "#") {
    alert("No hay audio disponible para este curso");
    return;
  }
  // Abrimos en una nueva pestaña
  window.open(audioUrl, "_blank");
});

/***************************************************
 * Cerrar el modal cuando se pulsa la "X"
 ***************************************************/
modalCerrar.addEventListener("click", ocultarModalResumen);

/***************************************************
 * Cerrar el modal haciendo click fuera del contenido
 ***************************************************/
window.addEventListener("click", (event) => {
  if (event.target === modalResumen) {
    ocultarModalResumen();
  }
});


/****************************************************
 * Ya NO definimos aquí el preguntasJSON porque,    *
 * en esta nueva versión, lo cargaremos dinámicamente
 * según el curso que seleccione el usuario         *
 ****************************************************/

// Variables globales
let todasLasPreguntas = [];
let preguntasSeleccionadas = [];
let indicePreguntaActual = 0;
let aciertos = 0;
let preguntasFalladas = [];

// Elementos HTML
const inicio = document.getElementById("inicio");
const btnComenzar = document.getElementById("btnComenzar");
const selectNumPreguntas = document.getElementById("numPreguntas");
const selectCurso = document.getElementById("cursoSelect");

const testContainer = document.getElementById("testContainer");
const preguntaContainer = document.getElementById("preguntaContainer");
const btnSiguiente = document.getElementById("btnSiguiente");

const resultadoContainer = document.getElementById("resultadoContainer");
const puntuacion = document.getElementById("puntuacion");
const erroresDiv = document.getElementById("errores");
const btnReiniciar = document.getElementById("btnReiniciar");
const btnReiniciarDuranteTest = document.getElementById("btnReiniciarDuranteTest");




/*******************************************************
 * Función para mezclar (barajar) un array aleatoriamente
 *******************************************************/
function mezclarArray(array) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
}

/**************************************************
 * Función para cargar el JSON del curso elegido  *
 **************************************************/
async function cargarPreguntas(cursoSeleccionado) {
  // Suponiendo que el fichero JSON se llama "curso1.json", "curso2.json", ...
  const archivoJSON = `${cursoSeleccionado}.json`;

  try {
    const response = await fetch(archivoJSON);
    if (!response.ok) {
      throw new Error(`No se pudo cargar el archivo: ${archivoJSON}`);
    }
    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Error al cargar el JSON:", error);
    alert("Ocurrió un error al cargar el JSON. Revisa la consola para más detalles.");
    return null;
  }
}

/***********************************************
 * Función para inicializar el test y preguntas *
 ***********************************************/
async function iniciarTest() {
  // Reseteamos variables
  indicePreguntaActual = 0;
  aciertos = 0;
  preguntasFalladas = [];
  todasLasPreguntas = [];
  preguntasSeleccionadas = [];

  // Tomamos la selección del usuario
  const numPreguntas = parseInt(selectNumPreguntas.value, 10);
  const cursoSeleccionado = selectCurso.value; // EJ: "curso1", "curso2", ...

  // Cargamos el JSON correspondiente al curso
  const preguntasJSON = await cargarPreguntas(cursoSeleccionado);
  if (!preguntasJSON) {
    return; // Si hay error en la carga, detenemos la ejecución
  }

  // Aplanamos todas las preguntas en un solo array
  for (const unidad in preguntasJSON) {
    if (preguntasJSON.hasOwnProperty(unidad)) {
      todasLasPreguntas = todasLasPreguntas.concat(preguntasJSON[unidad]);
    }
  }

  // Mezclamos todas las preguntas y seleccionamos las primeras n
  mezclarArray(todasLasPreguntas);
  preguntasSeleccionadas = todasLasPreguntas.slice(0, numPreguntas);

  // Ocultamos la pantalla de inicio y mostramos el contenedor del test
  inicio.classList.add("oculto");
  testContainer.classList.remove("oculto");

  // Mostramos la primera pregunta
  mostrarPregunta(indicePreguntaActual);
}

/******************************************************
 * Función para mostrar una pregunta en pantalla       *
 ******************************************************/
function mostrarPregunta(indice) {
  const pregunta = preguntasSeleccionadas[indice];
  preguntaContainer.innerHTML = "";

  // Crear título con el enunciado
  const enunciado = document.createElement("h3");
  enunciado.textContent = `Pregunta ${indice + 1}. ${pregunta.enunciado}`;
  preguntaContainer.appendChild(enunciado);

  // Crear las opciones como radio buttons
  for (const letra in pregunta.opciones) {
    if (pregunta.opciones.hasOwnProperty(letra)) {
      const opcionTexto = pregunta.opciones[letra];

      // Creamos un div para la opción
      const opcionDiv = document.createElement("div");
      opcionDiv.className = "opcion";

      // Creamos el input radio
      const radio = document.createElement("input");
      radio.type = "radio";
      radio.name = "opcion";
      radio.value = letra;

      // Creamos la etiqueta del radio
      const label = document.createElement("label");
      label.textContent = `${letra}) ${opcionTexto}`;

      opcionDiv.appendChild(radio);
      opcionDiv.appendChild(label);

      preguntaContainer.appendChild(opcionDiv);
    }
  }
}

/***************************************************************
 * Función que se ejecuta al pulsar "Siguiente" para verificar *
 * la respuesta elegida y pasar a la siguiente pregunta        *
 ***************************************************************/
function siguientePregunta() {
  // Obtenemos la opción seleccionada
  const radios = document.getElementsByName("opcion");
  let respuestaElegida = null;
  for (let i = 0; i < radios.length; i++) {
    if (radios[i].checked) {
      respuestaElegida = radios[i].value;
      break;
    }
  }

  // Si no se ha seleccionado ninguna opción, pedimos al usuario que seleccione
  if (!respuestaElegida) {
    alert("Por favor, seleccione una opción antes de continuar.");
    return;
  }

  // Verificamos la respuesta
  const preguntaActual = preguntasSeleccionadas[indicePreguntaActual];
  if (respuestaElegida === preguntaActual.respuesta_correcta) {
    aciertos++;
  } else {
    // Guardamos la pregunta fallada en el array
    preguntasFalladas.push({
      enunciado: preguntaActual.enunciado,
      respuestaSeleccionada: respuestaElegida,
      respuestaCorrecta: preguntaActual.respuesta_correcta,
      opciones: preguntaActual.opciones
    });
  }

  // Pasamos a la siguiente pregunta
  indicePreguntaActual++;

  // Si quedan más preguntas, las mostramos. Si no, mostramos el resultado
  if (indicePreguntaActual < preguntasSeleccionadas.length) {
    mostrarPregunta(indicePreguntaActual);
  } else {
    finalizarTest();
  }
}

/*****************************************************
 * Función para mostrar el resultado final del test  *
 *****************************************************/
function finalizarTest() {
  testContainer.classList.add("oculto");
  resultadoContainer.classList.remove("oculto");

  const totalPreguntas = preguntasSeleccionadas.length;
  puntuacion.textContent = `Has acertado ${aciertos} de ${totalPreguntas} preguntas.`;

  // Mostramos los errores, si los hay
  erroresDiv.innerHTML = "";
  if (preguntasFalladas.length > 0) {
    const tituloErrores = document.createElement("h3");
    tituloErrores.textContent = "Preguntas contestadas de forma incorrecta:";
    erroresDiv.appendChild(tituloErrores);

    preguntasFalladas.forEach((pf, index) => {
      const errorItem = document.createElement("div");
      errorItem.style.border = "1px solid #ccc";
      errorItem.style.margin = "10px 0";
      errorItem.style.padding = "10px";

      const preguntaTitulo = document.createElement("p");
      preguntaTitulo.innerHTML = `<strong>${index + 1}.</strong> ${pf.enunciado}`;
      errorItem.appendChild(preguntaTitulo);

      const respuestaDada = document.createElement("p");
      respuestaDada.textContent = `Respuesta elegida: ${pf.respuestaSeleccionada}) ${pf.opciones[pf.respuestaSeleccionada]}`;
      respuestaDada.style.color = "red";
      errorItem.appendChild(respuestaDada);

      const respuestaCorrecta = document.createElement("p");
      respuestaCorrecta.textContent = `Respuesta correcta: ${pf.respuestaCorrecta}) ${pf.opciones[pf.respuestaCorrecta]}`;
      respuestaCorrecta.style.color = "green";
      errorItem.appendChild(respuestaCorrecta);

      erroresDiv.appendChild(errorItem);
    });
  }
}

/*******************************************************
 * Permite reiniciar el test volviendo a la pantalla   *
 * de inicio y reseteando todos los contenedores       *
 *******************************************************/
function reiniciarTest() {
  resultadoContainer.classList.add("oculto");
  inicio.classList.remove("oculto");
}
function cancelarTest() {
    testContainer.classList.add("oculto");
    inicio.classList.remove("oculto");
  }
/******************************
 * Eventos de botones         *
 ******************************/
btnComenzar.addEventListener("click", iniciarTest);
btnSiguiente.addEventListener("click", siguientePregunta);
btnReiniciar.addEventListener("click", reiniciarTest);
btnReiniciarDuranteTest.addEventListener("click", cancelarTest);
