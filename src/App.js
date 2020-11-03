import React, { useState, useEffect } from 'react';
import { API, Storage } from 'aws-amplify';
import { withAuthenticator, AmplifySignOut } from '@aws-amplify/ui-react';
import { listNotes } from './graphql/queries';
import { createNote as createNoteMutation, deleteNote as deleteNoteMutation } from './graphql/mutations';

const initialFormState = { name: '', description: '' }

function App() {
  const [notes, setNotes] = useState([]);
  const [formData, setFormData] = useState(initialFormState);

  useEffect(() => {
    fetchNotes();
  }, []);
  async function onChange(e) {
    if (!e.target.files[0]) return
    const file = e.target.files[0];
    setFormData({ ...formData, image: file.name });
    await Storage.put(file.name, file);
    fetchNotes();
  }

  async function fetchNotes() {
    const apiData = await API.graphql({ query: listNotes });
    const notesFromAPI = apiData.data.listNotes.items;
    await Promise.all(notesFromAPI.map(async note => {
      if (note.image) {
        const image = await Storage.get(note.image);
        note.image = image;
      }
      return note;
    }))
    setNotes(apiData.data.listNotes.items);
  }

  async function createNote() {
    if (!formData.name || !formData.description) return;
    await API.graphql({ query: createNoteMutation, variables: { input: formData } });
    if (formData.image) {
      const image = await Storage.get(formData.image);
      formData.image = image;
    }
    setNotes([...notes, formData]);
    setFormData(initialFormState);
  }

  async function deleteNote({ id }) {
    const newNotesArray = notes.filter(note => note.id !== id);
    setNotes(newNotesArray);
    await API.graphql({ query: deleteNoteMutation, variables: { input: { id } } });
  }

  return (
    <div className="App">
      <h1>My Notes App</h1>
      <input
        onChange={e => setFormData({ ...formData, 'name': e.target.value })}
        placeholder="Note name"
        value={formData.name}
      />
      <input
        onChange={e => setFormData({ ...formData, 'description': e.target.value })}
        placeholder="Note description"
        value={formData.description}
      />
      <input
        type="file"
        onChange={onChange}
      />
      <button onClick={createNote}>Create Note</button>
      <div style={{ marginBottom: 30 }}>
        {
          notes.map(note => (
            <div key={note.id || note.name}>
              <h2>{note.name}</h2>
              <p>{note.description}</p>
              <button onClick={() => deleteNote(note)}>Delete note</button>
              {
                note.image && <img src={note.image} style={{ width: 400 }} />
              }
            </div>
          ))
        }
      </div>
      <AmplifySignOut />
    </div>
  );
}

export default withAuthenticator(App);

// import React, { useState, useEffect } from 'react';
// import Loading from './Loading';
// import Tours from './Tours';
// import { withAuthenticator, AmplifySignOut } from '@aws-amplify/ui-react'
// const url = 'https://course-api.netlify.app/api/react-tours-project';

// function App() {
//   const [loading, setLoading] = useState(true);
//   const [tours, setTours] = useState([]);

//   const removeTour = (id) => {
//     const newTours = tours.filter((tour) => tour.id !== id);
//     setTours(newTours);
//   };

//   const fetchTours = async () => {
//     setLoading(true);
//     try {
//       const response = await fetch(url);
//       const tours = await response.json();
//       setLoading(false);
//       setTours(tours);
//     } catch (error) {
//       setLoading(false);
//       console.log(error);
//     }
//   };
//   useEffect(() => {
//     fetchTours();
//   }, []);
//   if (loading) {
//     return (
//       <main>
//         <Loading />
//       </main>
//     );
//   }
//   if (tours.length === 0) {
//     return (
//       <main>
//         <div className="title">
//           <h2>no tours left</h2>
//           <button className="btn" onClick={() => fetchTours()}>
//             refresh
//           </button>
//         </div>
//       </main>
//     );
//   }
//   return (
//     <main>
//       <Tours tours={tours} removeTour={removeTour} />
//       <AmplifySignOut />
//     </main>
//   );
// }

// export default withAuthenticator(App);
