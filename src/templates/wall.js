// Importa las funciones necesarias
import { Timestamp } from 'firebase/firestore';
import { auth } from '../lib/firebase';
import {
  addNewPost,
  listenForPosts,
  deletePost,
  getPost,
  updatePost,
  getUserDoc,
} from '../lib/store';

function wall(navigateTo) {
  let editPost = null;
  const title = document.createElement('h2');
  const buttonClose = document.createElement('button');
  const section = document.createElement('section');
  const sectionUser = document.createElement('section');
  const newPostForm = document.createElement('form');
  const postArea = document.createElement('textarea');
  const buttonPost = document.createElement('button');
  const sectionPosts = document.createElement('section');
  const postsContainer = document.createElement('div');

  const divLogoB = document.createElement('div');
  divLogoB.classList.add('logo-blanco');
  const LogoBlanco = "<img id='imgLogoB' src=img/yummyBlanco.png width='200px' heigth='200px'>";
  divLogoB.innerHTML = LogoBlanco;

  section.classList.add('backgroundWall');
  buttonClose.classList.add('button-close');
  sectionUser.classList.add('sectionUser');
  title.classList.add('title-muro');
  newPostForm.classList.add('post');
  postArea.classList.add('postArea');
  buttonPost.classList.add('buttonPost');
  buttonPost.setAttribute('type', 'submit');
  sectionPosts.classList.add('sectionPosts');
  postsContainer.classList.add('postsCont');
  postArea.placeholder = 'Escribe una nueva publicación...';
  postsContainer.id = 'postcon';

  //const userActual = auth.currentUser;
  //console.log ('usuario',userActual);
  const dataUser = `
    <dl itemscope itemtype='user'>
      <dt>Nombre:</dt><dd itemprop='name'>María</dd>
      <dt>Región:</dt><dd itemprop='region'>Cali</dd>
      <dt>País:</dt><dd itemprop='country'>Colombia</dd>
    </dl>`;

  // title.textContent = 'Yummy';
  buttonClose.textContent = 'Cerrar sesión';
  buttonPost.textContent = 'Publicar';
  sectionUser.innerHTML = dataUser;

  const logout = () => {
    auth.signOut()
      .then(() => {
        console.log('Usuario cerró sesión correctamente');
      })
      .catch((error) => {
        console.error('Error al cerrar sesión:', error);
      });
  };

  buttonClose.addEventListener('click', () => {
    logout(); // Llamamos a la función de cierre de sesión
    navigateTo('/home'); // Redirigimos a la página de inicio
  });

  newPostForm.append(postArea, buttonPost);

  section.append(title, divLogoB, buttonClose, sectionUser, newPostForm, sectionPosts);
  console.log('botón ', buttonPost);

  buttonPost.addEventListener('click', async (event) => {
    event.preventDefault();
    const userActual = auth.currentUser;
    console.log('actual ', userActual);
    const objUser = await getUserDoc(userActual.uid) //obteniendo info de colección usuario
    console.log('x: ', objUser.name);
    const validateUser = userActual.displayName !== null ? userActual.displayName : objUser.name;
   
    const content = postArea.value.trim();
    if (content) {
      if (!editPost) {
        // Agregar el nuevo post a Firestore
        await addNewPost(validateUser, content);
      } else {
        // Editar el post existente
        await updatePost(editPost.id, content, validateUser, Timestamp.now());
        editPost = null; // Restablecer el estado de edición
        buttonPost.textContent = 'Publicar'; // Restaurar el texto del botón
      }
      // Limpiar el área de texto después de agregar o editar el post
      postArea.value = '';
    } else {
      // Mostrar un mensaje de error (puedes personalizar esto según tus necesidades)
      alert('Por favor, ingresa contenido antes de publicar');
    }
  });

  // Función para crear elementos de post
  function createPostElement(postData) {
    console.log('información: ', postData);
    const postElement = document.createElement('div');
    postElement.classList.add('post');

    const authorElement = document.createElement('p');
    authorElement.textContent = `${postData.author}`;

    const contentElement = document.createElement('p');
    contentElement.textContent = `${postData.content}`;

    const likeButton = document.createElement('button');
    likeButton.innerHTML = `<img src = ../img/likenegro.png width = '15px' heigth = '15px'>`;  // Puedes personalizar este ícono

    const editButton = document.createElement('button');
    editButton.innerHTML = `<img src = ../img/editarnegro.png width = '15px' heigth = '15px'>`;
    // Agregar el ícono al botón de editar
    const deleteButton = document.createElement('button');
    deleteButton.innerHTML = `<img src = ../img/borrarnegro.png width = '15px' heigth = '15px'>`; // Puedes personalizar este ícono

    // Agrega funciones de clic para cada botón
    likeButton.addEventListener('click', () => {
    // Lógica para dar like
      console.log(`Like para el post: ${postData.id}`);
    });

    editButton.addEventListener('click', async () => {
      // Lógica para editar el post
      const postDataEdit = await getPost(postData.id);
      // Verifica si el usuario actual es el autor del post
      const userActual = auth.currentUser;
      const validateUser = userActual !== null ? userActual.displayName : 'user';
      if (postDataEdit.author === validateUser) {
      postArea.value = postDataEdit.content;

      editPost = postDataEdit; // Establecer el estado de edición
      buttonPost.textContent = 'Guardar'; // Cambiar el texto del botón a "Guardar"
    } else {
      alert('No tienes permisos para editar este post.');
    }
    });
    deleteButton.addEventListener('click', () => {
      const userActual = auth.currentUser;
      const validateUser = userActual !== null ? userActual.displayName : 'user';
      if (postData.author === validateUser) {
        deletePost(postData.id);
      } else {
        alert('No tienes permisos para eliminar este post.');
      }
      console.log(`Borrar el post: ${postData.id}`);
    });

    postElement.appendChild(authorElement);
    postElement.appendChild(contentElement);
    postElement.appendChild(likeButton);
    postElement.appendChild(editButton);
    postElement.appendChild(deleteButton);

    return postElement;
  }

  listenForPosts((querySnapshot) => {
    postsContainer.innerHTML = '';
    querySnapshot.forEach((doc) => {
      const postData = { id: doc.id, ...doc.data() };
      const postElement = createPostElement(postData);
      postsContainer.append(postElement);
    });
  });

  sectionPosts.append(postsContainer);
  return section;
}
export default wall;
