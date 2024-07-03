document.addEventListener("DOMContentLoaded", function () {
  const cargarPeliculas = async () => {
    try {
      const options = { method: 'GET', headers: { accept: 'application/json' } };
      const respuesta = await fetch(
        `https://api.themoviedb.org/3/discover/movie?api_key=ce6c6eca048773cc1ff195955c0c3183&language=es-MX`, options);
      console.log(respuesta);
      if (respuesta.status === 200) {
        const datos = await respuesta.json();
        const peliculasHTML = datos.results.slice(0, 18)
          .map((pelicula) => {
            return `
              <div class="pelicula">
                <img class="poster" src="https://image.tmdb.org/t/p/w500/${pelicula.poster_path}" onclick="ver(${pelicula.id})">
              </div>
            `;
          })
          .join("");

        document.getElementsByClassName("inf")[0].innerHTML = peliculasHTML;
      } else if (respuesta.status === 401) {
        alert("Pusiste la llave mal");
      } else if (respuesta.status === 404) {
        alert("La película que buscas no existe");
      } else {
        alert("Hubo un error y no sabemos qué pasó");
      }
    } catch (error) {
      console.log(error);
    }
  };
  cargarPeliculas();
});

function ver(movieId) {
  window.location.href = `/users/verMovie?movieId=${movieId}`;
}
