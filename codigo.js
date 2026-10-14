"use strict";

const provincias = {
  "A Coruña": ["A Coruña", 1122000],
  "Albacete": ["Albacete", 389000],
  "Alacant/Alicante": ["Alicante", 1951000],
  "Almería": ["Almería", 753000],
  "Araba/Álava": ["Vitoria-Gasteiz", 338000],
  "Asturias": ["Oviedo", 1006000],
  "Ávila": ["Ávila", 159000],
  "Badajoz": ["Badajoz", 670000],
  "Barcelona": ["Barcelona", 5798000],
  "Burgos": ["Burgos", 358000],
  "Cáceres": ["Cáceres", 388000],
  "Cádiz": ["Cádiz", 1257000],
  "Cantabria": ["Santander", 592000],
  "Castelló/Castellón": ["Castellón de la Plana", 606000],
  "Ciudad Real": ["Ciudad Real", 492000],
  "Córdoba": ["Córdoba", 775000],
  "Cuenca": ["Cuenca", 199000],
  "Girona": ["Girona", 821000],
  "Granada": ["Granada", 933000],
  "Guadalajara": ["Guadalajara", 280000],
  "Gipuzkoa/Guipúzcoa": ["Donostia-San Sebastián", 729000],
  "Huelva": ["Huelva", 535000],
  "Huesca": ["Huesca", 227000],
  "Illes Balears": ["Palma", 1232000],
  "Jaén": ["Jaén", 618000],
  "La Rioja": ["Logroño", 322000],
  "Las Palmas": ["Las Palmas de Gran Canaria", 1131000],
  "León": ["León", 448000],
  "Lleida": ["Lleida", 452000],
  "Lugo": ["Lugo", 325000],
  "Madrid": ["Madrid", 7000000],
  "Málaga": ["Málaga", 1753000],
  "Melilla": ["Melilla", 86000],
  "Murcia": ["Murcia", 1552000],
  "Navarra": ["Pamplona/Iruña", 678000],
  "Ourense": ["Ourense", 304000],
  "Palencia": ["Palencia", 159000],
  "Pontevedra": ["Pontevedra", 945000],
  "Salamanca": ["Salamanca", 327000],
  "Santa Cruz De Tenerife": ["Santa Cruz de Tenerife", 1080000],
  "Segovia": ["Segovia", 154000],
  "Sevilla": ["Sevilla", 1967000],
  "Soria": ["Soria", 90000],
  "Tarragona": ["Tarragona", 861000],
  "Teruel": ["Teruel", 135000],
  "Toledo": ["Toledo", 733000],
  "València/Valencia": ["Valencia", 2657000],
  "Valladolid": ["Valladolid", 520000],
  "Bizkaia/Vizcaya": ["Bilbao", 1156000],
  "Zamora": ["Zamora", 167000],
  "Zaragoza": ["Zaragoza", 978000],
  "Ceuta": ["Ceuta", 83000]
};

const contenedorMapa = document.querySelector("#mapa");
const titulo = document.querySelector("#titulo-ficha");
const ayudaFicha = document.querySelector("#ayuda-ficha");
const datosProvincia = document.querySelector("#datos-provincia");
const capital = document.querySelector("#capital");
const habitantes = document.querySelector("#habitantes");
const estado = document.querySelector("#estado");
const formatoNumero = new Intl.NumberFormat("es-ES");
const svgNS = "http://www.w3.org/2000/svg";
let provinciaSeleccionada = null;

function coordenadaMapa(coordenada, nombreProvincia) {
  const [longitud, latitud] = coordenada;
  const factorLongitud = Math.cos((39 * Math.PI) / 180);

  if (nombreProvincia === "Las Palmas" || nombreProvincia === "Santa Cruz De Tenerife") {
    return [(longitud + 9.5) * factorLongitud, 34];
  }
  return [longitud * factorLongitud, latitud];
}

function proyectarGeometria(geometria, nombreProvincia) {
  const puntos = [];
  const partes = [];
  const anillos =
    geometria.type === "Polygon"
      ? [geometria.coordinates]
      : geometria.coordinates;

  for (const poligono of anillos) {
    for (const anillo of poligono) {
      const proyectado = anillo.map((coordenada) => coordenadaMapa(coordenada, nombreProvincia));
      puntos.push(...proyectado);
      partes.push(
        `${proyectado.map(([x, y], indice) => `${indice === 0 ? "M" : "L"}${x},${-y}`).join(" ")} Z`
      );
    }
  }

  return { puntos, ruta: partes.join(" ") };
}

function mostrarMapa(geojson) {
  const proyectadas = geojson.features.map((feature) => ({
    feature,
    ...proyectarGeometria(feature.geometry, feature.properties.name)
  }));
  const todosLosPuntos = proyectadas.flatMap(({ puntos }) => puntos);
  const limites = todosLosPuntos.reduce(
    (actuales, [x, y]) => ({
      izquierda: Math.min(actuales.izquierda, x),
      arriba: Math.min(actuales.arriba, -y),
      derecha: Math.max(actuales.derecha, x),
      abajo: Math.max(actuales.abajo, -y)
    }),
    {
      izquierda: Infinity,
      arriba: Infinity,
      derecha: -Infinity,
      abajo: -Infinity
    }
  );
  const margen = 0.18;
  const izquierda = limites.izquierda - margen;
  const arriba = limites.arriba - margen;
  const ancho = limites.derecha - izquierda + margen;
  const alto = limites.abajo - arriba + margen;
  const svg = document.createElementNS(svgNS, "svg");
  svg.setAttribute("viewBox", `${izquierda} ${arriba} ${ancho} ${alto}`);
  svg.setAttribute("role", "group");
  svg.setAttribute("aria-label", "Provincias de España");

  for (const { feature, ruta } of proyectadas) {
    const nombre = feature.properties.name;
    const provincia = document.createElementNS(svgNS, "path");
    const tituloProvincia = document.createElementNS(svgNS, "title");
    provincia.setAttribute("d", ruta);
    provincia.setAttribute("class", "provincia");
    provincia.setAttribute("tabindex", "0");
    provincia.setAttribute("role", "button");
    provincia.setAttribute("aria-label", nombre);
    tituloProvincia.textContent = nombre;
    provincia.append(tituloProvincia);
    provincia.addEventListener("click", () => seleccionarProvincia(nombre, provincia));
    provincia.addEventListener("keydown", (evento) => {
      if (evento.key === "Enter" || evento.key === " ") {
        evento.preventDefault();
        seleccionarProvincia(nombre, provincia);
      }
    });
    svg.append(provincia);
  }

  contenedorMapa.replaceChildren(svg);
}

function seleccionarProvincia(nombre, elemento) {
  const datos = provincias[nombre];
  if (!datos) {
    estado.textContent = `No hay datos disponibles para ${nombre}.`;
    return;
  }

  provinciaSeleccionada?.classList.remove("seleccionada");
  provinciaSeleccionada = elemento;
  provinciaSeleccionada.classList.add("seleccionada");
  titulo.textContent = nombre;
  ayudaFicha.hidden = true;
  datosProvincia.hidden = false;
  capital.textContent = datos[0];
  habitantes.textContent = `≈ ${formatoNumero.format(datos[1])}`;
  estado.textContent = `${nombre} seleccionada`;
}

if (!window.provinciasGeoJSON) {
  estado.textContent = "No se pudieron cargar los datos locales del mapa.";
  throw new Error("Falta el archivo local mapa-provincias.js.");
}

mostrarMapa(window.provinciasGeoJSON);
estado.textContent = "52 provincias y ciudades autónomas. Selecciona una para consultar sus datos.";
