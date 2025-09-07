export async function salvarPaciente(formData) {
  var myHeaders = new Headers();
  myHeaders.append("Content-Type", "application/json");

  var raw = JSON.stringify(formData);

  var requestOptions = {
    method: 'POST',
    headers: myHeaders,
    body: raw,
    redirect: 'follow'
  };

  try {
    const response = await fetch("https://mock.apidog.com/m1/1053378-0-default/pacientes", requestOptions);
    const result = await response.json();
    return result;
  } catch (error) {
    console.log('error', error);
    throw error;
  }
}

