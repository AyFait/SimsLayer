// frontend/src/App.tsx
import React, { useState } from 'react';


function App() {
	const [file, setFile] = useState<File | null>(null);
	const [progress, setProgress] = useState<string | null>(null);


	const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
	 if (e.target.files && e.target.files.length > 0) setFile(e.target.files[0]);
}


	const upload = async () => {
	 if (!file) return;
	 const fd = new FormData();
	 fd.append('file', file);
// optional: linear_deflection param
	 fd.append('linear_deflection', '0.1');


	setProgress('Uploading...');
	const resp = await fetch('http://127.0.0.1:8000/convert', {
	 method: 'POST',
	 body: fd,
});


	if (!resp.ok) {
	 const txt = await resp.text();
	 setProgress('Error: ' + txt);
	 return;
}


// get blob and download
	const blob = await resp.blob();
	const url = window.URL.createObjectURL(blob);
	const a = document.createElement('a');
	a.href = url;
	a.download = (file.name.replace(/\.step$|\.stp$/i, '') || 'model') + '.stl';
	document.body.appendChild(a);
	a.click();
	a.remove();
	window.URL.revokeObjectURL(url);
	setProgress('Done — STL downloaded');
}


return (
	<div style={{padding:20, fontFamily:'sans-serif'}}>
		<h2>Local STEP → STL Converter</h2>
		<input type="file" accept=".step,.stp" onChange={onFileChange} />
		<div style={{marginTop:10}}>
		<button onClick={upload} disabled={!file}>Convert & Download STL</button>
	</div>
	{progress && <p>{progress}</p>}
	<p>Note: backend must be running at http://127.0.0.1:8000</p>
	</div>
	);
}


export default App;
