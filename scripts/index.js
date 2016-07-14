// Per un'introduzione al modello vuoto, vedere la seguente documentazione:
// http://go.microsoft.com/fwlink/?LinkID=397704
// Per eseguire il debug del codice al caricamento della pagina in Ripple o in dispositivi/emulatori Android: avviare l'app, impostare i punti di interruzione, 
// quindi eseguire "window.location.reload()" nella console JavaScript.
(function () {
    "use strict";
   
    document.addEventListener('deviceready', onDeviceReady.bind(this), false);
    var intervalMap;


    function onDeviceReady() {
        console.log("Device Pronto");
        // Gestire gli eventi di sospensione e ripresa di Cordova
        document.addEventListener( 'pause', onPause.bind( this ), false );
        document.addEventListener( 'resume', onResume.bind( this ), false );
        
        
        // TODO: Cordova è stato caricato. Eseguire qui eventuali operazioni di inizializzazione richieste da Cordova.
       
        if (cordova.platformId == 'android') {
            StatusBar.backgroundColorByHexString("#ff0000");
        }

        var AppDir = cordova.file.externalApplicationStorageDirectory;
        CreaCartella("FotoProfilo");
        CreaCartella("Immagini");
        CartellaFotoProfilo = cordova.file.externalApplicationStorageDirectory + "FotoProfilo";
        CartellaImmagini = cordova.file.externalApplicationStorageDirectory + "Immagini";
        inizio = new Date().getTime();
        window.sqlitePlugin.openDatabase({ name: "my.db" }, function (db) {
            fine = new Date().getTime();
            console.log('Accesso al db: ' + (fine - inizio));
            InizializeDB(db);
            
        });
        //////////////Inizializzo lo stato della connessione/////////////////////////
        document.addEventListener("online", function () {
            online = true;
        }, false);
        document.addEventListener("offline", function () {
            online = false;
        }, false);
        var networkState = navigator.connection.type;

        online= ((networkState != Connection.NONE) && (networkState != Connection.UNKNOWN))
        //////////////////////////////////////////////////
        $(function () {
            $('li').removeClass("ui-btn-icon-right");
        });
        ////////////////////////////////////////////////////////////////////////////////
        //Mappa OnCreate
        $(document).on("pagecreate", "#mappa", function () { 
            $(document).on("swipeleft swiperight", "#mappa", function (e) {
                if ($.mobile.activePage.jqmData("panel") !== "open") {
                    if (e.type === "swipeleft") {                                        
                        $("#left-panel").panel("close");
                    } else if (e.type === "swiperight") {
                        $("#left-panel").panel("open");                       
                    }
                }              
            });
            $("#left-panel").panel({
                open: function (event, ui) {
                        if (map != null)
                            map.setClickable(false);
                },
                close: function (event, ui) {
                  if (map != null)
                      map.setClickable(true);
                }
            });
            document.getElementById("refreshbutton").addEventListener("click", function () {
                clearInterval(intervalMap);
                UpdateMarkerAndFriend();
                intervalMap = setInterval(UpdateMarkerAndFriend, 20000);
            });
            console.debug("Richiedo il GPS");
            navigator.geolocation.getCurrentPosition(
                PositionSuccess,
                PositionFailure,
                { maximumAge: 5000, timeout: 5000, enableHighAccuracy: true });
            CaricaPreferenze();
            LoadMap();
        });

        //Mappa OnResume
        $(document).on("pageshow", "#mappa", function () {
            CambiaTipoMappa();
            intervalMap = setInterval(UpdateMarkerAndFriend, 20000);
        });
        
        //Mappa OnLeft
        $(document).on("pagebeforehide", "#mappa", function () {
            //Fermo l'aggiornamento dei marker e della lista amici quando esco dallla pagina
            clearInterval(intervalMap);
        });
        ///////////////////////////////////////////////////////////////////////////////
        $(document).on("pagecreate", "#SendFoto", function () {
            $("#TakeFromCamera").on("tap", function () {
                navigator.camera.getPicture(onCameraSuccess, onCameraError);
            });
            $("#OpenFromGalleryButton").on("tap", function () {
                console.log("Accedo alla Photogallery");
                var source = navigator.camera.PictureSourceType.PHOTOLIBRARY;
                var destination = navigator.camera.DestinationType.FILE_URI;
                navigator.camera.getPicture(onOpenFromGallerySucces, onCameraError, {
                    quality: 100,
                    destinationType: destination,
                    sourceType: source
                });
                console.log("Ho aperto gallery");
            });
            $("#sendFotoButton").on("tap", function () {
                uploadPhotoToServer();
            });
            
        });
        $(document).on("pageshow", "#SendFoto", function () {
            $("#sendFotoButton").addClass("ui-state-disabled");
            
        });
        $(document).on("pagebeforehide", "#SendFoto", function () {
            $("#fotoAnteprima").attr("src","");
        });
        ///////////////////////////////////////////////////////////////////////////////
        $(document).on("pagecreate", "#login", function () {
            console.log("Creo login");
        });
        $(document).on("pageshow", "#login", function () {
        });

        $(document).on("pageshow", "#dialogPage", function () {
            $("#userSelected").html("Hai cliccato su: "+userSelected.nome);
        });

        $(document).on("pageshow", "#sigup", function () {

        });
        ////////////////////////////////////////////////////////////////////////////////

        $(document).on("pagecreate", "#menu", function () {
            window.plugins.pushNotification.register(
                successHandler,
                errorHandler, {
                    'senderID': '219531960288',
                    'ecb': 'onNotificationGCM'}
            );           
        });

        
        $(document).on("pageshow", "#friendlist", function () {
            AggiornaListaAmici();
            AddFriendAdapter();
            $('#friendListList').listview('refresh');
        });
        
        $(document).on("pageshow", "#searchfriend", function () {
            GetNotFriend();
            AddNotFriendAdapter();
            $('#NotfriendList').listview('refresh');
        });


        $(document).on("pageshow", "#MapSettings", function () {
            //Carico le preferenze
            //
            $(".Settings").bind( "change", function(event, ui) {
                SalvaPreferenze();
                });
        });

        $(document).on("pageshow", "#notifiche", function () {            
            NotizieAdapter();           
        });

        
    };

    function onPause() {
        // TODO: questa applicazione è stata sospesa. Salvarne lo stato qui.
    };

    function onResume() {
        // TODO: questa applicazione è stata riattivata. Ripristinarne lo stato qui.
    };
} )();