var idUserLogged = 23;

var friendList = [];
var notificheList = [];


var notFriendList = [];
var idLogin;
var mycoords;
var map;
var userSelected;
var markersList = [];

var TipoMappa;
var OrdineAmici;

var db;

var CartellaFotoProfilo;
var CartellaImmagini;

var online;



////////////COSTRUTTORI////////////////////
function Utente(json) {
    json = JSON.parse(json);
    this.image = json["nomeFoto"]; 
    this.id = json["id"];
    this.nome = json["nome"];
    this.telefono = json["telefono"];
    this.Lat = json["lat"].replace(",",".");    
    this.Lng = json["long"].replace(",", ".");;
    this.lastUpPosition = StringToDate(json["lastUpPosition"]);
    this.lastUpdate = StringToDate(json["lastUpdate"]);
    this.distanza = 0;
    this.stored = false;
}

Utente.prototype = {
    GetFoto: function GetFoto() {
        if (this.image == "" || this.image == null)//non c'è la foto
            return "images/noImage.jpg";
        else if (this.stored) {
            return CartellaFotoProfilo+"/" + this.image;
            
        }
        else if (!online) {
            return "images/noImage.jpg";
        }
        else 
            return "http://server-geoshare.rhcloud.com/FotoProfilo/" + this.image;
        
    }    
}

function Notifica(json) {
    this.id = json["id"];
    this.idMittente = json["idMittente"];
    this.idDestinatario = json["idDestinatario"];
    this.tipo = json["tipo"] == "1" ? true : false;
    this.nomeFoto = json["nomeFoto"];
    this.stored = false;
    //console.log("Notifica : "+id+ " - "+nomefoto+" - tipo:"+tipo);
}

Notifica.prototype = {
    GetFoto: function GetFoto() {
        if (this.nomeFoto == "" || this.nomeFoto == null)//non c'è la foto
            return "images/error404.jpg";
        else if (this.stored) {         
            return CartellaImmagini + "/" + this.nomeFoto;            
        }
        else if (!online) {
            return "images/error404.jpg";
        }
        else
            return "http://server-geoshare.rhcloud.com/Uploads/Temp/" + this.nomeFoto;
    }
}

///////////////UTILITY/////////////////////////////
function StringToDate(stringa) {
    giorno =stringa[0]+""+stringa[1];
    mese =stringa[3]+""+stringa[4];
    anno =stringa[6]+""+stringa[7]+""+stringa[8]+""+stringa[9];
    ore =stringa[11]+""+stringa[12];
    minuti =stringa[14]+""+stringa[15];
    secondi =stringa[17]+""+stringa[18];
    return new Date(anno, mese, giorno, ore, minuti, secondi, 0);    
}

function DateToString(data) {
    anno = data.getFullYear();
    mese = data.getMonth();
    giorno = data.getDate();
    ore = data.getHours();
    minuti = data.getMinutes();
    secondi = data.getSeconds();
    return (giorno < 10 ? "0" + giorno : giorno) + "/" + (mese < 10 ? "0" + mese : mese) + "/" + anno + " " + ore + ":" + minuti + ":" + secondi;
}

//////////////ADAPTER///////////////////////
/*
 * Vuoto la lista degli amici presente nella page Mappa e la rigenero 
 */

function AddMapFriendAdapter() {   
    $("#friendListMap").empty();    
    var sortedList = SortList();
    $.each(sortedList, function (i) {
        var dist = parseInt(this.distanza) + " metri";
        var temp = getTimeText(this.lastUpPosition);
        //$("#friendListMap").append('<li class="MapListAdapter" onclick="MapListUserClick(' + this.id + ')">img src="' + this.image + '" /></td><td><h3 class="linkToUser">' + this.nome + '</h3></td></tr><tr><td><h3>'+dist+' metri</h3></td></tr><tr><td><h3>'+temp+'</h3></td></tr></table></li>');
        $("#friendListMap").append('<li><a href="javascript:MapListUserClick(' + this.id + ')"><img src="' + this.GetFoto() + '"><h2>' + this.nome + '</h2><p>' + dist + '</p><p>' + temp + '</p></a></li>');
    });
}

/*
 * Svuoto e rigenero la lista amici presenta nella pagina "Amici"
 */
function AddFriendAdapter() {
   $("#friendListList").empty();
    $.each(friendList,function(i){
        $("#friendListList").append('<li><a href="javascript:SelectFriendPage(' + i + ')"><img src="' + this.GetFoto() + '"><h2>' + this.nome + '</h2></a></li>');
    });    
}
/*
 * Svuoto e rigenero la lista dei non amici presenta nella pagina "Cerca Amici"
 */
function AddNotFriendAdapter() {
    $("#NotfriendList").empty();
    $.each(notFriendList, function (i) {
        $("#NotfriendList").append('<li><a href="javascript:SelectFriendPage(' + i + ')"><img src="' + this.GetFoto() + '"><h2>' + this.nome + '</h2></a></li>');
    });
}
/*
 *
 */
function NotizieAdapter() {
    $("#NotizieList").empty();
    $.each(notificheList, function (i) {
        mittente = GetUserById(this.idMittente);
        if (this.stored) {
            $("#NotizieList").append('<li><a href="javascript:PopupOpenFoto(' + mittente.id + ',' + i + ')" style="background-color: #A9F5D0"><img src="' + mittente.GetFoto() + '" /><h3>' + mittente.nome + '</h3><p><strong>ti ha inviato una foto</strong><p>Clicca per aprire</p></a><a href="javascript:DeleteNotifica(' + i + ')" style="background-color: #A9F5D0" data-icon="delete" data-role="button" data-iconpos="notext">Cancella Notifica</a></li>');
        }
        else if(this.tipo)
            $("#NotizieList").append('<li><a href="javascript:PopupDownloadFoto(' + mittente.id + ',' + i + ')" style="background-color: #F7BE81"><img src="' + mittente.GetFoto() + '"/><h3>' + mittente.nome + '</h3><p><strong>ti ha inviato una foto</strong><p>Clicca per scaricare</p></a><a href="javascript:DeleteNotifica(' + i + ') data-icon="delete" style="background-color: #F7BE81" data-role="button" data-iconpos="notext">Cancella Notifica</a></li>   ');
        else
            $("#NotizieList").append('<li><a href="javascript:PopupAcceptFriendship(' + mittente.id + ',' + i + ')"   style="background-color: #CEECF5"><img src="' + mittente.GetFoto() + '" /><h3>' + mittente.nome + '</h3><p><strong>ti ha inviato una richiesta di amicizia</strong><p>Clicca per accettare</p></a><a href="javascript:DeleteNotifica(' + i + ') style="background-color: #CEECF5" data-icon="delete" data-role="button" data-iconpos="notext">Cancella Notifica</a></li>   ');
    });
    $('#NotizieList').listview('refresh');
}

function PopupDownloadFoto(userID,notifica) {
    $("#popupNotizie").popup({
        transition: "pop"
    });
    mittente = GetUserById(userID);
    not = notificheList[notifica];    
    $("#popupNotizieText").html("Vuoi scaricare la foto?");    
    $("#popupNotizie").popup("open");
    $("#popupNotizieImg").css("max-width", "100%")
    $("#popupNotizieImg").attr("src", not.GetFoto());
    $("#AcceptButtonPopupNotizie").unbind().click(function () {
        console.log("ho cliccato!");
        //aggiungo la notizia al db
        InsertNotifica(not);
        //scarico la foto
        imgUrl = "http://server-geoshare.rhcloud.com/Uploads/" + not.nomeFoto;
        ScaricaFoto(imgUrl, CartellaImmagini);
        //chiudo il popup e aggiorno la lista
        $("#popupNotizie").popup("close");
    });
}

function PopupAcceptFriendship(userID,notifica) {
    $("#popupNotizie").popup({
        transition: "pop"
    });
    mittente = GetUserById(userID);
    $("#popupNotizieText").html("Vuoi diventare amico di "+mittente.nome);
    $("#popupNotizieImg").attr("src", mittente.GetFoto());
    $("#popupNotizieImg").css("max-width", "100%")
    $("#popupNotizie").popup("open");
    $("#AcceptButtonPopupNotizie").unbind().click(function () {
        AddFriend(mittente);
        DeleteNotifica(notifica);
        $("#popupNotizie").popup("close");
    });    
}

function PopupOpenFoto(userID, notifica) {
    not = notificheList[notifica];
    window.plugins.webintent.startActivity({
        action: window.plugins.webintent.ACTION_VIEW,
        url: not.GetFoto(),
        type:"image/*"
    },
    function() {},
    function() {alert('Failed to open URL via Android Intent')});
}

function DeleteNotifica(notifica) {
    not = notificheList[notifica];
    //rimuovo dal server
    $.ajax({
        type: "POST",
        url: "http://server-geoshare.rhcloud.com/Controller.php",
        data: {
            RemoveNotify: not.id
        }
    });   
    if (not.stored) {
        RemoveNotiziaFromDB(not);
    }
    //rimuovo dalla lista
    notificheList.splice(notifica, 1);
    //aggiorno la lista
    NotizieAdapter();
}


//////////////////////////////Utility////////////////////////
/*
 * Selezionato un amico nella pagina amico, questa funzione mi porta alla sua "pagina del profilo"
 */
function SelectFriendPage(num) {
    var user;
    var page = "searchfriend";
    if ($.mobile.activePage.attr("id") == "friendlist") {
        user = friendList[num];
        page = "friendlist";
    }
    else user = notFriendList[num];
    $.mobile.changePage("#userPage");
    $("#nomeUtente").html(user.nome);
    $("#telefonoUtente").html(user.telefono);
    $("#imgUtente").attr("src", user.GetFoto());
}

/*
 * Funzione ache aggiorna la lista amici (solo gli id)
 */
function AggiornaListaAmici(){
    if (!online)
        return;
    var listaID = GetFriendsIDFromServer();
    //controllo che ci siano state modifiche    
    //se qualcuno aggiunto, aggiungo alla lista e al db
    contatore = 0;
    iduser=-1;
    for (i = 0; i < listaID.length; i++) {
        contatore = 0;
        iduser = listaID[i];
        for (j = 0; j < friendList.length; j++) {
            if (iduser != friendList[j].id)
                contatore++;
            else
                break;
        }
        if (contatore == friendList.length) {
            //prendo dal server l'utente con id iduser e aggiungo al db    
            user = GetUserByIdFromServer(iduser);
            AddFriendToDB(user);
            friendList.push(user);          
        }				
    }    
    //se qualcuno rimosso, rimuovo dalla lista e dal db
    for (i = 0; i <  friendList.length; i++) {
        contatore = 0;
        for (j = 0; j < listaID.length; j++) {
            iduser = listaID[j];
            if (iduser != friendList[i].id)
                contatore++;
            else
                break;
        }
        if (contatore == listaID.length) {
            RemoveUtenteFromDB(friendList[i].id);
            friendList.splice(i,1);
        }				
    }
}

/*
 *
 */
function GetUserById(id) {
    us = null
    $.each(friendList, function () {
        if (this.id == id)
            us = this;
    });
    if (us == null)
        us = GetUserByIdFromServer(id);
    return us;
}

/*
 * Scarico dal server la lista degli amici dell'utente connesso
 */
function GetFriendsIDFromServer() {   
    var listaID = [];
    if (!online)
        return listaID;
    $.ajax({
        type: "POST",
        url: "http://server-geoshare.rhcloud.com/Controller.php",
        data: {
            getFriendsId: idUserLogged
        },
        async: false,
        success: function (response) {            
            var obj = JSON.parse(response);
            jQuery.each(obj, function () {
                listaID.push(this);
                
            });           
        },
        error: function (xhr, status, error) {
            console.log("Non sono riuscito a connettermi al server, prendo la lista dal db");
        }
    });
    return listaID;
}

function GetUserByIdFromServer(id) {
    var utente;
    if (!online)
        return null;
    $.ajax({
        type: "POST",
        url: "http://server-geoshare.rhcloud.com/Controller.php",
        data: {
            userById: id
        },
        async: false,
        success: function (response) {
            utente = new Utente(response);
        },
        error: function (response) {
            console.log("Errore di connessione: " + response);
        }
    });
    return utente;
}

/*
 * Dato l'id viene restituito l'oggetto "utente" con id id
 */
function AddFriend(id) {
    AddFriendToServer(id);
}

function RemoveFriend(id) {   
    RemoveFriendFromServer(id);
}

function AddFriendToDB(user) {
    //Scarico la foto
    ScaricaFoto("http://server-geoshare.rhcloud.com/FotoProfilo/" + user.image, CartellaFotoProfilo);
    InsertUtente(user);
    user.stored = true;
}

function AddFriendToServer(id) {
    $.ajax({
        type: "POST",
        url: "http://server-geoshare.rhcloud.com/Controller.php",
        data: {
            AddFriend: "ok",
            idUser: idUserLogged,
            idUser2:id           
        },
        success: function (response) {
        },
        error: function (response) {
            navigator.notification.alert("Utente non aggiunto per assenza di connessione", function () { }, "Errore");
        }
    });
}

function RemoveFriendFromServer(id) {
    $.ajax({
        type: "POST",
        url: "http://server-geoshare.rhcloud.com/Controller.php",
        data: {
            RemoveFriend: "ok",
            idUser: idUserLogged,
            idUser2: id
        },
        success: function (response) {
            RemoveUtenteFromDB(id);
        },
        error: function (response) {
            navigator.notification.alert("Utente non rimosso per assenza di connessione", function () { }, "Errore");
        }
    });
}

function GetAllNotifiche() {
    //Scarico
    nuove = [];
    if (!online)
        return nuove;
    $.ajax({
        type: "POST",
        url: "http://server-geoshare.rhcloud.com/Controller.php",
        data: {
            GetAllNotifiche: "ok",
            id: idUserLogged
        },
        async: false,
        success: function (response) {
            var obj = JSON.parse(response);
            jQuery.each(obj, function () {
                not = new Notifica(this);
                nuove.push(not);
            });
        },
        error: function (response) {
            navigator.notification.alert("Assenza di connessione", function () { }, "Errore");
        }
    });
    return nuove;
}

/*
 * Funzione invocata nel caso venga trovata la posizione dell'utente. Sposta il centro della mappa su dove si trova l'utente.
 */
function PositionSuccess(position) {
    mycoords = position.coords;
    if (map != null) {
        var GOOGLE = new plugin.google.maps.LatLng(mycoords.latitude, mycoords.longitude);
        map.moveCamera({
            'target': GOOGLE,
            'tilt': 0,
            'zoom': 18,
            'bearing': 0
        }, function () {
        });
    }

}

/*
 * Funzione invocata nel caso non si riesce a trovare la posizione
 */
function PositionFailure(error) {
    console.log("Errore nel trovare il GPS");
    var messaggio = "";
    console.log("errore: " + error.code);
    switch (error.code) {
         
        case 1:
            messaggio = "L'applicazione non è autorizzata all'acquisizione della posizione corrente";
            break;
             
        case 2:
            messaggio = "Non è disponibile la rilevazione della posizione corrente";
            break;
             
        case 3:
            messaggio = "Non è stato possibile rilevare la posizione corrente";
            break;
    }
         
    navigator.notification.alert(messaggio, function() {}, "Avviso");
}

/*
 * Viene caricata la mappa. Viene impostato l'intervallo di tempo di aggiornamento della lista amici e dei marker
 */
function LoadMap() {
    if (map == null) {
        var mapDiv = document.getElementById("map_canvas");
        var map = plugin.google.maps.Map.getMap(mapDiv);
        map.on(plugin.google.maps.event.MAP_READY, onMapInit);        
    }
    if (mycoords != null) {
        var GOOGLE = new plugin.google.maps.LatLng(mycoords.latitude, mycoords.longitude);
        map.moveCamera({
            'target': GOOGLE,
            'tilt': 0,
            'zoom': 18,
            'bearing': 0
        }, function () {
        });
    }
    switch (TipoMappa) {
        case "satellite":
            var mapType = plugin.google.maps.MapTypeId.SATELLITE;
            break;
        case "hybrid":
            var mapType = plugin.google.maps.MapTypeId.HYBRID;
            break;
        case "terrain":
            var mapType = plugin.google.maps.MapTypeId.TERRAIN;
            break;
        default:
            var mapType = plugin.google.maps.MapTypeId.ROADMAP;
            break;
    }
    map.setMapTypeId(mapType);
}

/*
 * Funzione invocata nel momento in cui la mappa sarà pronta. Imposta il primo update dei marker.
 */
function onMapInit(m) {
    console.debug("Mappa Pronta");
    map = m;
    $("#map_canvas").css({ 'height': '100%' });
    $("._gmaps_cdv_").css({ 'height': '100%' });
    map.setMyLocationEnabled(true);
    UpdateMarkerAndFriend();
}

function CambiaTipoMappa() {
    switch (TipoMappa) {
        case "satellite":
            var mapType = plugin.google.maps.MapTypeId.SATELLITE;
            break;
        case "hybrid":
            var mapType = plugin.google.maps.MapTypeId.HYBRID;
            break;
        case "terrain":
            var mapType = plugin.google.maps.MapTypeId.TERRAIN;
            break;
        default:
            var mapType = plugin.google.maps.MapTypeId.ROADMAP;
            break;
    }
    map.setMapTypeId(mapType);
}

function getDistanceFromLatLonInMeters(lat1, lon1, lat2, lon2) {
    var R = 6371000; // Radius of the earth in km
    var dLat = deg2rad(lat2 - lat1);  // deg2rad below
    var dLon = deg2rad(lon2 - lon1);
    var a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2)
    ;
    var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    var d = R * c; // Distance in km
    return d;
}

function deg2rad(deg) {
    return deg * (Math.PI / 180)
}

/*
 * Quando clicco su un amico nella lista amici della mappa, vengo portato al suo marker.
 */
function MoveToFriend(i) {
    var friend = friendList[i];
    var friendCoords = new plugin.google.maps.LatLng(friend.Lat, friend.Lng);
    if (map != null) {       
        map.moveCamera({
            'target': friendCoords,
            'tilt': 0,
            'zoom': 15,
            'bearing': 0
        }, function () {
        });
    }
}

/*
 * Aggiorna la lista amici
 */
function UpdateMarkerAndFriend() {
    AggiornaListaAmici();
    if (map != null) {        
        markersList = [];
        map.clear();
        $.each(friendList, function (i) {
            var msg = [this.nome].join("\n") ;
            map.addMarker({
                'position': new plugin.google.maps.LatLng(friendList[i].Lat, friendList[i].Lng),
                'title': msg
            }, function (marker) {
                markersList[friendList[i].id] = marker ;
                marker.addEventListener(plugin.google.maps.event.INFO_CLICK, function () {
                                      
                    $("#popupBasic").bind({
                        popupafteropen: function(event, ui) {
                            map.setClickable(false);
                            userSelected = friendList[i].id;
                        },
                        popupafterclose: function(event, ui) {
                            map.setClickable(true);
                        }
                    });
                    $("#popupBasic").popup({
                        transition: "pop"
                    });
                    $("#MapPopupText").html("Vuoi inviare una foto ad " + friendList[i].nome + " ?");
                    $("#MapPopupImg").attr("src", friendList[i].GetFoto());
                    
                    $("#popupBasic").popup("open");
                });   
            });
            //Imposto la distanza tra l'utente loggato e l'amico
            if (this.Lat != null && this.Lat != "" && mycoords != null) {
                this.distanza = getDistanceFromLatLonInMeters(this.Lat, this.Lng, mycoords.latitude, mycoords.longitude);
            }            
            AddMapFriendAdapter();
            $('#friendListMap').listview('refresh');
        });       
    }   
}

function SortList() {
    switch (OrdineAmici) {
        case "distanza":
            friendList.sort(function (a, b) { return b.distanza - a.distanza });
            break;
        default:
            friendList.sort(function (a, b) { return a.nome - b.nome });
            break;
    }
    return friendList;
}

function MapListUserClick(id) {
    var marker = markersList[id];
    $("#left-panel").panel("close");
    marker.getPosition(function (latLng) {
        if (map != null) {
            map.animateCamera({
                'target': latLng,
                'tilt': 0,
                'zoom': 18,
                'bearing': 0,
                'duration': 1000
            }, function () {
                marker.showInfoWindow();
            });
        }
    });
   
}

function SalvaPreferenze() {
    TipoMappa = $("[name='MapType'] :selected").val();
    OrdineAmici = $("[name='FriendOrder'] :selected").val();
    window.localStorage.setItem("TipoMappa", TipoMappa);
    window.localStorage.setItem("OrdineAmici", OrdineAmici);
}

function CaricaPreferenze() {
    TipoMappa = window.localStorage.getItem("TipoMappa");
    OrdineAmici = window.localStorage.getItem("OrdineAmici");
    $("[name='MapType']").val(TipoMappa);
    $("[name='FriendOrder']").val(OrdineAmici);
}

function getTimeText(lastUP){
    if (lastUP == ("01/01/0001 00:00:00"))
        return "Mai Aggiornato.";
    var data1 = Date.UTC(lastUP.getFullYear(), lastUP.getMonth(), lastUP.getDate());
    var oggi = new Date();
    var data2 = Date.UTC(oggi.getFullYear(), oggi.getMonth(), oggi.getDate());
    var secondi = Math.floor((data1 - data2) / 1000);
    if (secondi < 60)
        return secondi + " secondi fa";
    else if (secondi >= 60 && secondi < 3600)
        return secondi / 60 + " minuti fa";
    else if (secondi >= 3600 && secondi < 86400)
        return secondi / 3600 + " ore fa";
    else
        return secondi / 86400 + " giorni fa";
}

function onCameraSuccess(imageURI) {
    switch ($.mobile.activePage.attr("id")) {
        case 'SendFoto':
            $("#fotoAnteprima").attr("src", imageURI).css({ width: "128px", height: "128px" });
            $("#sendFotoButton").removeClass("ui-state-disabled");
            break;
        default:
            break;
    }
}

function onCameraError(errorMessage) {  
    navigator.notification.alert(errorMessage, function() {}, "Errore");  
}

function uploadPhotoToServer() {
    var photoURI = $("#fotoAnteprima").attr("src");
    var nuovoNome;
    $.ajax({
        type: "POST",
        url: "http://server-geoshare.rhcloud.com/Controller.php",
        data: {
            uploadNewFoto:"ok",
            idSender: idUserLogged,
            idReceiver:userSelected,
            nomefoto: photoURI
        },
        async: false,
        success: function (response) {
            nuovoNome = response;
        },
        error: function (response) {
            console.log("Errore di connessione: " + response);
        }
    });
    var options = new FileUploadOptions();
    var url = encodeURI("http://server-geoshare.rhcloud.com/Upload.php");    
    options.fileKey = "file";
    options.fileName = nuovoNome;
    options.mimeType = "image/jpeg";    
    ft = new FileTransfer();
    ft.upload(photoURI,url, function(result){
        if (result.responseCode == 200) {
            navigator.camera.cleanup();
            PutNotification(true,nuovoNome);
        } else {
            navigator.notification.alert("Il server non ha potuto elaborare la scheda");
        }
    }, onFailureSend, options);
}

function onFailureSend(error) {
    var message = "";
    switch (error.code) {
        case FileTransferError.FILE_NOT_FOUND_ERR:
            messaggio = "Non è stato possibile trovare la foto associata alla scheda";
            break;
        case FileTransferError.INVALID_URL_ERR:
            messaggio = "URL inesistente o errata";
            break;
        case FileTransferError.CONNECTION_ERR:
            messaggio = "Errore di connessione";
            break;
        case FileTransferError.ABORT_ERR:
            messaggio = "Trasferimento interrotto";
            break;
    }
    navigator.notification.alert(messaggio, function () { }, "Errore");
}

function onOpenFromGallerySucces(imageURI) {
    window.FilePath.resolveNativePath(imageURI, onCameraSuccess, onFailureSend);
}

function PutNotification(isFoto,nomeFoto) {
    console.log("Invio la notifica!");
    $.ajax({
        type: "POST",
        url: "http://server-geoshare.rhcloud.com/Controller.php",
        data: {
            PutNotification: "ok",
            idSender: idUserLogged,
            idReceiver: userSelected,
            foto: isFoto ? "1" : "0",
            pathFile: nomeFoto
        },
        async: false,
        success: function (response) {
        },
        error: function (response) {
            console.log("Errore di connessione: " + response);
        }
    });
}

function successHandler(result) {
   // console.log("Token: " + result.gcm);
}

function errorHandler(error) {
    console.log("Error: " + error);
}


function onNotificationGCM(e) {
    switch (e.event) {
        case 'registered':
            if (e.regid.length > 0) {
                //console.log("Token: "+e.regid)
                sendTokenToServer(e.regid);
            }
            break;
        case 'message':
            if (e.foreground) {
                var notifica = new Notifica(e.message);
                if (!notifica.tipo) {
                    navigator.notification.alert("Hai ricevuto una richiesta di amicizia da: " + GetUserById(notifica.idMittente).nome);
                } else {
                    navigator.notification.alert("Hai ricevuto una foto da: " +  GetUserById(notifica.idMittente).nome);
                }
                //TODO
                //Inserisco la notizia nel db
            }
            break;
        case 'error':
            console.log('Error: ' + e.msg);
            break;
        default:
            console.log('An unknown event was received');
            break;
    }
}

function sendTokenToServer(token) {
    $.ajax({
        type: "POST",
        url: "http://server-geoshare.rhcloud.com/Controller.php",
        data: {
            sendToken: token,
            id: idUserLogged
        },
        success: function (response) {
            
        },
        error: function (response) {
            console.log("Errore di connessione: " + response);
        }
    });
}

function GetNotFriend() {
    notFriendList = [];
    if (!online) {
        return;
    }
    $.ajax({
        type: "POST",
        url: "http://server-geoshare.rhcloud.com/Controller.php",
        data: {
            GetNotFriend: idUserLogged
        },
        async: false,
        success: function (response) {
            var obj = JSON.parse(response);
            var user;
            jQuery.each(obj, function () {
                user = new Utente(JSON.stringify(this));
                notFriendList.push(user);
            });
        },
        error: function (xhr, status, error) {
            console.log("Errore: " + xhr.responseText);
        }
    });
}

/////////////////////// DB FUNCTION ////////////////////////
function InizializeDB(database) {
    db = database;
    db.transaction(function (tx) {
        transition = tx;
        db.executeSql('CREATE TABLE IF NOT EXISTS Utente (id integer primary key, nomeFoto text, nome text, telefono text, lat text,long text, lastUpPosition text,lastUpdate text)');
        db.executeSql('CREATE TABLE IF NOT EXISTS Notifica (id integer primary key, idMittente text, idDestinatario text, tipo text,nomeFoto text)');
        InizializzaListaAmici();
        InizializzaListaNotifiche();
    }, function (err) {
        console.log('Open database ERROR: ' + JSON.stringify(err));
    });
}

function InsertUtente(utente) {
    db.transaction(function (tx) {
        tx.executeSql("INSERT INTO Utente (`id`, `nomeFoto`, `nome`, `telefono`, `lat`, `long`, `lastUpPosition`, `lastUpdate`) values (" + utente.id + ", '" + utente.image + "' , '" + utente.nome + "' , '" + utente.telefono + "' ,'" + utente.Lat + "' ,'" + utente.Lng + "' ,'" + utente.lastUpPosition + "','" + utente.lastUpdate + "')");
        utente.stored = true;
    }, function (e) {
        console.log("Errore insert: " + e.code);
        UpdateUtente(utente);
    }, function() {
        console.log('INSERT transaction OK');
    });   
}

function UpdateUtente(utente) {
    db.transaction(function (tx) {
        tx.executeSql("UPDATE `Utente` SET `nomeFoto`='" + utente.image + "',`nome`='" + utente.nome + "',`telefono`='" + utente.telefono + "',`lat`='" + utente.Lat + "',`long`='" + utente.Lng + "',`lastUpPosition`='" + utente.lastUpPosition + "',`lastUpdate`='" + utente.lastUpdate + "' WHERE id=" + utente.id);
     }, function (e) {
        console.log('Transaction error: ' + e.message);
    }, function () {
        console.log('Update Utente transaction OK');
    });
}

function InsertNotifica(notifica) {
    db.transaction(function (tx) {
        tx.executeSql("INSERT INTO Notifica (`id`, `idMittente`, `idDestinatario`, `tipo`, `nomeFoto`) values (" + notifica.id + ", '" + notifica.idMittente + "' , '" + notifica.idDestinatario + "' , '" + notifica.tipo + "' ,'" + notifica.nomeFoto + "')");
        notifica.stored = true;
    }, function (e) {
        console.log("Errore insert: " + e.code + "  - - " + e.message);
        UpdateNotifica(notifica);
    }, function () {
        console.log('INSERT transaction OK');
    });
}

function UpdateNotifica(notifica) {
    db.transaction(function (tx) {
        tx.executeSql("UPDATE `Notifica` SET `nomeFoto`='" + notifica.nomeFoto + "' WHERE id=" + notifica.id);
    }, function (e) {
        console.log('Transaction error: ' + e.message);
    }, function () {
        console.log('Update transaction OK');
    });
}

function RemoveNotiziaFromDB(notifica) {
    db.transaction(function (tx) {
        tx.executeSql("DELETE From Notifica where id=" + notifica.id);        
        DeleteFoto(notifica.nomeFoto,CartellaImmagini);        
    }, function (e) {
        console.log("Errore Delete: " + e.message);
        
    }, function () {
        console.log('Notifica eliminata');
    });
}

function RemoveUtenteFromDB(utente) {
    db.transaction(function (tx) {
        tx.executeSql("DELETE From Utente id=" + utente.id);
        //TO DO
        //CAncello la suo foto dal DEVICE
        DeleteFoto(utente.image, CartellaFotoProfilo);
    }, function (e) {
        console.log("Errore insert: " + e.message);
       
    }, function () {
        console.log('Utente Eliminato');
    });
}

function InizializzaListaAmici() {    
    db.transaction(function (tx) {
        tx.executeSql('SELECT * FROM  Utente ', [], function (tx, results) {
            for (i = 0; i < results.rows.length; i++) {
                user = new Utente(JSON.stringify(results.rows.item(i)))
                user.stored = true;
                friendList.push(user);
            }            
        });
    }, function (e) {
        console.log('Transaction error: ' + e.message);
    }, function () {
        console.log('Lista Amici Inizializzata');        
    });
}

function InizializzaListaNotifiche() {   
    db.transaction(function (tx) {
        tx.executeSql('SELECT * FROM  Notifica', [], function (tx, results) {
            for (i = 0; i < results.rows.length; i++) {
                not = new Notifica(JSON.parse(JSON.stringify(results.rows.item(i))));
                not.stored = true;
                notificheList.push(not);
            }
        });
    }, function (e) {
        console.log('Transaction error: ' + e.message);
    }, function () {
        var nuoveNotifiche = [];

        nuoveNotifiche = GetAllNotifiche();

        $.each(nuoveNotifiche, function (i) {
            if (GetNotificaById(this.id) == null)
                notificheList.push(this);
        });
        console.log('Lista Notifiche Inizializzata');
    });

}

function GetNotificaById(id){
    $.each(notificheList, function () {
        if(this.id == id)
            return this;
    });
    return null;
}

/////////////////////////////////////////////////////////////

function CreaCartella(nomeCartella) {  
   // window.requestFileSystem = window.requestFileSystem || window.webkitRequestFileSystem;
    window.resolveLocalFileSystemURL(cordova.file.externalApplicationStorageDirectory,
        function (fileSystem) {
            var options = {
                create: true,
                exclusive: true
            };
            fileSystem.getDirectory(nomeCartella, options, onDirectorySuccess, onDirectoryFail);
    }
    , function (error) {        
        navigator.notification.alert(error.code, function () { }, "Errore");
    });
}

function onDirectorySuccess(parent) {
    //console.log(parent);    
}

function onDirectoryFail(error) {
    var msg;
    switch (error.code) {
        case 1:
            msg = 'NOT_FOUND_ERR';
            break;
        case 2:
            msg = 'SECURITY_ERR';
            break;
        case 3:
            msg = 'ABORT_ERR';
            break;
        case 4:
            msg = 'NOT_READABLE_ERR';
            break;
        case 5:
            msg = 'ENCODING_ERR';
            break;
        case 6:
            msg = 'NO_MODIFICATION_ALLOWED_ERR';
            break;
        case 7:
            msg = 'INVALID_STATE_ERR';
            break;
        case 8:
            msg = 'SYNTAX_ERR';
            break;
        case 9:
            msg = 'INVALID_MODIFICATION_ERR';
        case 10:
            msg = 'QUOTA_EXCEEDED_ERR';
        case 11:
            msg = 'TYPE_MISMATCH_ERR';
            break;
        default:
            msg = null;
    }
    if (msg != null) {
        navigator.notification.alert(msg, function () { }, "Errore");
    }   
}

function ScaricaFoto(imgUrl, path) {
    console.log("Scarico la foto "+imgUrl+" in "+path);
    var fileTransfer = new FileTransfer();
    var uri = encodeURI(imgUrl);
    var nomeFoto = imgUrl.substring(imgUrl.lastIndexOf("/") + 1, imgUrl.length);
    fileTransfer.download(
        uri,
        path + "/"+nomeFoto,
        function (entry) {
            console.log("download complete: " + entry.toURL());
            $.each(friendList,function(){
                if (this.image == imgUrl) {
                    this.image = entry.toURL();
                    UpdateUtente(this);
                }
            });
        },
        function (error) {
            console.log("download error source " + error.source);
            console.log("download error target " + error.target);
            console.log("upload error code" + error.code);
        },
        false,
        {
            headers: {
                "Authorization": "Basic dGVzdHVzZXJuYW1lOnRlc3RwYXNzd29yZA=="
            }
        }
    );
}

function DeleteFoto(nomeFoto, cartella) {
    window.resolveLocalFileSystemURL(cartella, function (fileSystem) {
        fileSystem.getFile(nomeFoto, { create: false }, function (fileEntry) {
            fileEntry.remove(function () {
                //rimosso
            }, function (error) {
                //errore durante la rimozione
            });
        }, function (err) {
           //errore file non trovato
        });
    }, function (er) {
       //errore errore cartella non trovata
    });
}

function FileExist(path,nomeFile) {
    var directory = path +"/"+ nomeFile;
    window.resolveLocalFileSystemURL(directory, function (fileSystem) {
        if (fileSystem.isFile === true) {
            return true;
        } else {
            return false;
        }
    }, function (error) {
        return false;
    });
}

var inizio;
var fine;
var p;
function TestDB() {
    for (i = 0; i < 1; i++) {
        k = 10000;
        db.executeSql('DROP TABLE Notifica');
        db.executeSql('CREATE TABLE IF NOT EXISTS Notifica (id integer primary key, idMittente text, idDestinatario text, tipo text,nomeFoto text)');
        var lista = [];
        for (j = 0; j < k; j++) {
            var not = new Notifica("");
            not.id = j;
            lista.push(not);
        }
        inizio = new Date().getTime();
        p = 0;
        $.each(lista, function (t) {
            db.transaction(function (tx) {
                tx.executeSql("INSERT INTO Notifica (`id`) values (" + lista[t].id + ")");
                p++;
            }, function (e) {
                console.log("Errore insert: " + e.code + "  - - " + e.message);
            }, function () {
                fine = new Date().getTime();
                if(p==k)
                console.log(j + ' Inseriti : ' + (fine - inizio));
            });
        });
    }
}

function TestDBSelect() {   
    inizio = new Date().getTime();
    db.transaction(function (tx) {
        tx.executeSql('SELECT * FROM  Notifica', [], function (tx, results) {
            lista = [];
            for (i = 0; i < results.rows.length; i++) {
                lista.push(new Notifica(JSON.parse(JSON.stringify(results.rows.item(i)))));
            }
            fine = new Date().getTime();
            console.log(j + ' Prelevati : ' + (fine - inizio));
        });
     }, function (e) {
            console.log('Transaction error: ' + e.message);
     }, function () {

     });
}

