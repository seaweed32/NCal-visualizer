var fileInput = document.getElementById('file_input');
let dates = [];
let ratings = [];
let notes = [];
let finalRecord = {};
let curRecord;
let displayOpen = false;

document.getElementById('file_input_button').addEventListener('click', () => fileHandler());
//sort by whatever the chosen value is from the sort menu when a change is detected, aka, sort when asked to sort
document.getElementById('sort_menu').addEventListener('change', () => sortAndDisplay(document.getElementById('sort_menu').value));
document.getElementById('sort_dir').addEventListener('click', () => swapSortDirection());

function sortAndDisplay(value){
    function sort(valuePosition){
        let dayHoldArr = [];
        //fill the above array with arrays of values from the finalRecord
        for(let key in finalRecord){
            let day = finalRecord[key];
            //date, rating, note, date as ms, rating as float, note length
            dayHoldArr.push([day['date'],day['rating'],day['note'],new Date(day['date']).getTime(),parseFloat(day['rating'].split('/')[0]),day['note'].length]);
        }
        //sort the array by the value at the input index
        //some slight chatGPT was involved in this part because my brain shat itself, and apparently NaN is not equal to itself...????????????????????????????? 
        dayHoldArr.sort(function(a, b) {
            let aValue = a[valuePosition];
            let bValue = b[valuePosition];

            if (isNaN(aValue) && isNaN(bValue)) {
                return 0;
            } else if (isNaN(aValue)) {
                return -1;
            } else if (isNaN(bValue)) {
                return 1;
            } else {
                return aValue - bValue;
            }
        });
        let sortedObj = {};
        //rebuild the object, but sorted
        for(let item of dayHoldArr){
            sortedObj[dayHoldArr.indexOf(item)] = {};
            sortedObj[dayHoldArr.indexOf(item)].date = item[0];
            sortedObj[dayHoldArr.indexOf(item)].rating = item[1];
            sortedObj[dayHoldArr.indexOf(item)].note = item[2];
        }
        curRecord = sortedObj;
        return sortedObj;
    }
    document.getElementById('sort_dir').innerHTML = '⮟';
    document.getElementById('display_box').scrollTo(0,0);
    //input the correct index for the sort function depending on the sort value
    if(value == 'date') displayDayList(sort(3));
    else if(value == 'rating') displayDayList(sort(4));
    else if(value == 'length') displayDayList(sort(5));
}

function swapSortDirection(){
    let dir = document.getElementById('sort_dir').innerHTML;
    document.getElementById('sort_dir').innerHTML = (dir == '⮝' ? '⮟' : '⮝');
    let swappedObj = {};
    for(let key = Object.keys(curRecord).length-1; key >= 0; key--){
        let day = curRecord[key];
        swappedObj[Object.keys(curRecord).length-key-1] = day;
    }
    curRecord = swappedObj;
    displayDayList(swappedObj);
}

function fileHandler(file){
    let fileR = new FileReader();
    //send the read file to be processed when the read is completed; onload means it has been completed
    fileR.onload = () => {
        processText(fileR.result);
    }
    if(!file){ //only do this if a file has not been input to the function. This is because when a file is input, it is because it has been dropped in instead of being chosen, and it can just go to be read
        //when a file is input, read it as text
        fileInput.addEventListener('change', function () {
            fileR.readAsText(fileInput.files[0]);
        })
        fileInput.click();
    } else {
        fileR.readAsText(file);
    }
}

//stop the dropped file from opening like it normally would
function dragOver(event){
    event.preventDefault();
}
//send the dropped file to the file reader
function dropHandler(event){
    event.preventDefault();
    const file = event.dataTransfer.items[0].getAsFile();
    fileHandler(file);
}

function processText(text){
    //split the text at either the gap inbetween a SINGLE linebreak and a number, or the gap inbetween a SINGLE linebreak and the string N/A
    //it doesn't do everything I'd like to have done to the text, but it's the best I can get realistically.
    let newText = text.split(/(?<!\n)\n(?=\d)|(?<!\n)\n(?=N\/A)/g);
    //separate the info from the notes
    newText = newText.map((i) => i.split(',,,,,,'));
    //add all the notes to the notes array
    for(let arr of newText){notes.push(arr[1])}
    //split the info into arrays
    newText = newText.map((i) => i[0].split(','));
    //0 is the rating, 3 is the date. Add all dates and ratings to their respective arrays
    for(let arr of newText){
        dates.push(formatDate(parseInt(arr[3])));
        ratings.push(arr[0]);
    }
    //remove the pesky jumbled mess from the begining of each array
    dates.shift();
    ratings.shift();
    notes.shift();

    //remove quotes from the start and end of the notes if present, and make double double quotes single double quotes
    for(let i=0; i<notes.length; i++){
        let element = notes[i];
        if(element) notes[i] = element.replace(/^"|"$|(?<=")"/g,'');
        else notes[i] = 'No discription';
    };
    //assemble the object from the arrays
    for(i=0;i<dates.length;i++){
        if(!finalRecord[i]) finalRecord[i] = {}; //add an empty object to the object property so it can set the values for the days
        finalRecord[i].date = dates[i];
        finalRecord[i].rating = ratings[i];
        finalRecord[i].note = notes[i];
    }
    sortAndDisplay('date');
}

function formatDate(time){
    let date = new Date(time).toDateString();
    return date;
}

function displayDayList(data){
    //show and hide stuff
    document.getElementById('file_input_button').style.display = 'none';
    document.getElementById('download_button').style.display = 'block';
    document.getElementById('back_button').style.display = 'block';
    document.getElementById('sort_menu').style.display = 'block';
    document.getElementById('sort_dir').style.display = 'block';
    const dispBox = document.getElementById('display_box');
    dispBox.innerHTML = '';
    let lables = document.createElement('div');
    lables.className = 'day';
    lables.innerHTML = 'Date ----- Rating ----- Discription';
    lables.id = 'lables';
    dispBox.appendChild(lables);
    dispBox.style.display = 'block';
    //make a new day box for each day and add the corresponding data to it
    for(let key in data){
        const day = data[key];
        let newElement = document.createElement('div');
        newElement.id = `${key}`
        newElement.className = 'day';
        newElement.innerHTML = `${day.date} ----- ${day.rating} ----- ${day.note}`
        dispBox.appendChild(newElement)
    }
    //make each day clickable with a display
    Array.from(document.getElementsByClassName('day')).forEach((element) => {
        element.addEventListener('click', function (event){
            displayDiscription(data[event.target.id]);
        });
    });
    document.getElementById('download_button').addEventListener('click',() => downloadFunc(proccessObjForFile()));
    document.getElementById('back_button').addEventListener('click',() => {if(!displayOpen) window.location.reload();});
}

function displayDiscription(day){
    if(!displayOpen){
        displayOpen = true;
        const dispBox = document.getElementById('display_box');
        const box = document.getElementById('discription_box');
        //add a function to the close button that will undo the code below this and close the box
        document.getElementById('close_button').addEventListener('click', function(){
            dispBox.style.opacity = '100%';
            document.getElementById('download_button').style.opacity = '100%';
            document.getElementById('back_button').style.opacity = '100%';
            box.style.display = 'none';
            displayOpen = false;
        })
        //cloud out the stuff behind the description box
        dispBox.style.opacity = '60%';
        document.getElementById('download_button').style.opacity = '60%';
        document.getElementById('back_button').style.opacity = '60%';
        box.style.display = 'block';
        //add specific day info to the box
        document.getElementById('day_info').innerHTML = `${day.date} ----- ${day.rating}`
        document.getElementById('text_box').innerText = day.note;
    }
}
//download a txt file from a text input; some old function from another project; could be very much improved but i don't feel like it
function downloadFunc(text) {  
    const blob = new Blob([text], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
  
    const downloadLink = document.createElement('a');
    downloadLink.href = url;
    downloadLink.download = `NCal backup ${curDate()}.txt`;
  
    document.body.appendChild(downloadLink);
    downloadLink.click();
    document.body.removeChild(downloadLink);
    URL.revokeObjectURL(url);
}
//get the curent date in a mm/dd/yy format for the name of the exported file
function curDate(){
    const date = new Date();
    const month = date.getMonth()+1;
    const day = date.getDate();
    const year = String(date.getFullYear()).slice(-2);
    return `${month}-${day}-${year}`;
}
//this formats the object that all the data is stored in, turning it into a string and making it readable in the downloaded file
function proccessObjForFile(){
    let textContent = 'Date - Rating - Description\n----------------------------------------\n\n';
    for(let key in finalRecord){
        let prop = finalRecord[key];
        textContent += `${prop.date} - ${prop.rating}\n\n${prop.note}\n\n----------------------------------------\n\n`;
    }
    return textContent;
}

