(function ()
{
    'use strict';

    angular
            .module('app.contacts')
            .controller('ContactsController', ContactsController);

    /** @ngInject */
    function ContactsController($scope, $mdSidenav, Contacts, User, msUtils, $mdDialog, $document, $rootScope, Upload, FileUploader, $translate, api, $mdToast)//,Upload,FileUploader,$translate, api, $mdToast //FileUploader,$mdDialog,$rootScope,$scope,// 
    {

        var vm = this;

        // Data
        vm.contacts = Contacts.data;
        vm.user = User.data;
        vm.filterIds = null;
        vm.listType = 'all';
        vm.listOrder = 'name';
        vm.listOrderAsc = false;
        vm.selectedContacts = [];
        vm.newGroupName = '';

        // Methods
        vm.filterChange = filterChange;
        vm.openContactDialog = openContactDialog;
        vm.deleteContactConfirm = deleteContactConfirm;
        vm.deleteContact = deleteContact;
        vm.deleteSelectedContacts = deleteSelectedContacts;
        vm.toggleSelectContact = toggleSelectContact;
        vm.deselectContacts = deselectContacts;
        vm.selectAllContacts = selectAllContacts;
        vm.deleteContact = deleteContact;
        vm.addNewGroup = addNewGroup;
        vm.deleteGroup = deleteGroup;
        vm.toggleSidenav = toggleSidenav;
        vm.toggleInArray = msUtils.toggleInArray;
        vm.exists = msUtils.exists;

        //////////

        /**
         * Change Contacts List Filter
         * @param type
         */
        function filterChange(type)
        {
            console.log(type);
            vm.listType = type;

            if (type === 'all')
            {
                vm.filterIds = null;
            } else if (type === 'frequent')
            {
                vm.filterIds = vm.user.frequentContacts;
            } else if (type === 'starred')
            {
                vm.filterIds = vm.user.starred;
            } else if (angular.isObject(type))
            {
                vm.filterIds = type.contactIds;
            }
            vm.selectedContacts = [];
        }

        /**
         * Open new contact dialog
         *
         * @param ev
         * @param contact
         */
        function openContactDialog(ev, contact)
        {
            $mdDialog.show({
                controller: 'ContactDialogController',
                controllerAs: 'vm',
                templateUrl: 'app/main/apps/contacts/dialogs/contact/contact-dialog.html',
                parent: angular.element($document.find('#content-container')),
                targetEvent: ev,
                clickOutsideToClose: true,
                locals: {
                    Contact: contact,
                    User: vm.user,
                    Contacts: vm.contacts
                }
            });
        }

        /**
         * Delete Contact Confirm Dialog
         */
        function deleteContactConfirm(contact, ev)
        {
            var confirm = $mdDialog.confirm()
                    .title('Are you sure want to delete the contact?')
                    .htmlContent('<b>' + contact.name + ' ' + contact.lastName + '</b>' + ' will be deleted.')
                    .ariaLabel('delete contact')
                    .targetEvent(ev)
                    .ok('OK')
                    .cancel('CANCEL');

            $mdDialog.show(confirm).then(function ()
            {

                deleteContact(contact);
                vm.selectedContacts = [];

            }, function ()
            {

            });
        }

        /**
         * Delete Contact
         */
        function deleteContact(contact)
        {
            vm.contacts.splice(vm.contacts.indexOf(contact), 1);
        }

        /**
         * Delete Selected Contacts
         */
        function deleteSelectedContacts(ev)
        {
            var confirm = $mdDialog.confirm()
                    .title('Are you sure want to delete the selected contacts?')
                    .htmlContent('<b>' + vm.selectedContacts.length + ' selected</b>' + ' will be deleted.')
                    .ariaLabel('delete contacts')
                    .targetEvent(ev)
                    .ok('OK')
                    .cancel('CANCEL');

            $mdDialog.show(confirm).then(function ()
            {

                vm.selectedContacts.forEach(function (contact)
                {
                    deleteContact(contact);
                });

                vm.selectedContacts = [];

            });

        }

        /**
         * Toggle selected status of the contact
         *
         * @param contact
         * @param event
         */
        function toggleSelectContact(contact, event)
        {
            if (event)
            {
                event.stopPropagation();
            }

            if (vm.selectedContacts.indexOf(contact) > -1)
            {
                vm.selectedContacts.splice(vm.selectedContacts.indexOf(contact), 1);
            } else
            {
                vm.selectedContacts.push(contact);
            }
        }

        /**
         * Deselect contacts
         */
        function deselectContacts()
        {
            vm.selectedContacts = [];
        }

        /**
         * Sselect all contacts
         */
        function selectAllContacts()
        {
            vm.selectedContacts = $scope.filteredContacts;
        }

        /**
         *
         */
        function addNewGroup()
        {
            if (vm.newGroupName === '')
            {
                return;
            }

            var newGroup = {
                'id': msUtils.guidGenerator(),
                'name': vm.newGroupName,
                'contactIds': []
            };

            vm.user.groups.push(newGroup);
            vm.newGroupName = '';
        }

        /**
         * Delete Group
         */
        function deleteGroup(ev)
        {
            var group = vm.listType;

            var confirm = $mdDialog.confirm()
                    .title('Are you sure want to delete the group?')
                    .htmlContent('<b>' + group.name + '</b>' + ' will be deleted.')
                    .ariaLabel('delete group')
                    .targetEvent(ev)
                    .ok('OK')
                    .cancel('CANCEL');

            $mdDialog.show(confirm).then(function ()
            {

                vm.user.groups.splice(vm.user.groups.indexOf(group), 1);

                filterChange('all');
            });

        }

        /**
         * Toggle sidenav
         *
         * @param sidenavId
         */
        function toggleSidenav(sidenavId)
        {

            $mdSidenav(sidenavId).toggle();

        }

        /*********************************************************************/

        var vm = this;
        vm.num = 0;

        var user = api.user;

        $scope.showTable = false;

        $scope.images_temp = {};

        $scope.users = [];

        // Table options
        $scope.dtInstance = {};
        $scope.dtOptions = {
            dom: 'rt<"bottom"<"left"<"length"l>><"right"<"info"i><"pagination"p>>>',
            columnDefs: [
                {
                    // Target the actions column
                    targets: 4,
                    responsivePriority: 1,
                    filterable: false,
                    sortable: false
                }
            ],
            pagingType: 'simple',
            order: [],
            lengthMenu: [10, 20, 30, 50, 100], // options for elements in pagination
            pageLength: 20,
            scrollY: 'auto',
            responsive: true
        };

        // Init
        $scope.init = function ()
        {
            $scope.mode = 'list';
            $scope.pages = {
                per_page: $rootScope.perpage,
                total: 0,
                current_page: 1,
                last_page: 0
            };
            $scope.search = {q: ""};
            $scope.previousSearch = false;
        };

        // List
        $scope.list = function ()
        {
            $scope.users = [];
            if ($rootScope.users)
            {
                $scope.users = $rootScope.users;
                $scope.showTable = true;
            } else if ($rootScope.pusherlist['users'])
            {
                for (var i in $rootScope.pusherlist['users'])
                {
                    $scope.users.push($rootScope.pusherlist['users'][i]);
                }
                $scope.showTable = true;
            } else
            {
                //console.log("from DB");
                user.list.get({
                    limit: $scope.pages.per_page,
                    page: $scope.pages.current_page,
                    q: $scope.search.q
                },
                        function (response) // Success
                        {
                            $scope.status = "Success";
                            var data = response.data;
                            for (var i in data)
                            {
                                $scope.users.push(data[i]);
                            }
                            $rootScope.users = $scope.users;
                            $scope.showTable = true;
                        },
                        function (response) // Error
                        {
                            $scope.status = "Error";
                            $scope.toaster(response.msg);
                        }
                );
            }
        };

        // Toaster
        $scope.toaster = function (value)
        {
            var msg = "";
            var pinTo = "top right";
            if (value.status == 'success')
            {
                msg = 'Success: ';
            } else
            {
                msg = 'Error: ';
            }
            msg = msg + value.message;
            $mdToast.show($mdToast.simple().textContent(msg).position(pinTo).hideDelay(8000));
        };

        //Check delete (Confirmation)
        $scope.showDelete = function (user)
        {
            var confirm = $mdDialog.confirm()
                    .title('Are you sure?')
                    .content('The user will be deleted.')
                    .ariaLabel('Delete User')
                    .ok('Delete')
                    .cancel('Cancel')
                    .targetEvent(event);

            $mdDialog.show(confirm).then(function ()
            {
                $scope.delete(user);
            }, function ()
            {
                // Cancel Action
                $mdDialog.hide();
            });
        };



        $scope.delete = function (item)
        {
            item._id = item._id.$id;
            user.delete.delete(item,
                    function (response) // Success
                    {
                        if (response.list.data)
                        {
                            $rootScope.users = response.list.data;
                        }
                        $scope.refresh();
                        $scope.toaster(response);
                    },
                    function (response) // Error
                    {
                        $scope.status = "Error";
                        $scope.toaster(response);
                    }
            );
        };

        $scope.edit = function (item)
        {
            $scope.item = item;
            delete $scope.item.images;
            delete $scope.item.cached_images;
            delete $scope.item.cached_image_thumbnails;
//            $scope.item.images = [];
//            $scope.item.cached_images = [];
//            $scope.item.cached_image_thumbnails = [];



            //I change this condition
            if ($scope.item.group_ids[0] && $scope.item.group_ids[0] == '560ea9c686597bea7202c847') {
                $scope.item.role = 'admin';
            } else if ($scope.item.group_ids[1] && $scope.item.group_ids[1]) {
                $scope.item.role = 'collaborator';
            } else if ($scope.item.group_ids[2] && $scope.item.group_ids[2]) {
                $scope.item.role = 'viewer';
            }

            //$scope.item.role = ($scope.item.group_ids[0] && $scope.item.group_ids[0] == '560ea9c686597bea7202c847') ? 'moderator' : 'operator';
            $scope.mode = 'edit';
            $scope.item.first_name = item.first_name;
            $scope.item.last_name = item.last_name;
            $scope.item.title = item.title;
            $scope.item.password = "";
            $scope.item.passwordConfirm = "";
            $scope.saveImage();
        };

        // Show create view
        $scope.create = function ()
        {
            $scope.mode = 'create';
            $scope.item = {images: [], cached_images: [], cached_image_thumbnails: []};
        };

        $scope.close = function ()
        {
            $scope.restoreImage();
            $scope.mode = 'list';
        };

        $scope.store = function ()
        {
            console.dir($scope.item);
            user.create.save($scope.item,
                    function (response)  // Success
                    {
                        if (response.list.data)
                        {
                            $rootScope.users = response.list.data;
                        }
                        $scope.refresh();
                        $scope.item.passwordConfirm = "";
                        $rootScope.toaster(response);
                    },
                    function (response)  // Error
                    {
                        $scope.status = "Error";
                        $rootScope.toaster(response);
                    }
            );

//                $translate('ACTIVEUSER.Firstnamerequired').then(function (transalation) {
//                    $scope.messages = {'status': 'error', 'message': transalation};
//                    $scope.toaster($scope.messages);
//                });
        };

        // Select an image for user
        $scope.onFileSelect = function ($file, index, model)
        {
            if ($file !== null)
            {
                if ($file.size < 2000000)
                {
                    $scope.loadingImage = true;
                    // Upload path
                    var upload_path = '/upload-api/' + (($file.type.indexOf('image') !== -1) ? 'image' : 'document');

                    $scope.upload = Upload.upload({
                        url: $rootScope.baseurl + upload_path,
                        data: {item: $scope.item.id, file: $file, method: 'post'}

                    })
                            .progress(function (evt) {
                                //console.log('percent: ' + parseInt(100.0 * evt.loaded / evt.total));
                            })
                            .success(function (response) {
                                if (response)
                                {
                                    if (response.cached_image)
                                    {
                                        $scope.item.image = $rootScope.baseurl + response.cached_image.path;
                                    }

                                    if (response.image)
                                    {
                                        $scope.item.images.push(response.image.path);
                                    }

                                    // $scope.uploaded = false;
                                }
                                $scope.loadingImage = false;
                            });
                } else
                {
                    var msg = {status: 'error', message: 'Image is too big.'};
                    $scope.toaster(msg);
                }
            }

        };

        $scope.restoreImage = function ()
        {
            if (typeof $scope.images_temp.file !== 'undefined')
            {
                $scope.item.file = $scope.images_temp.file;
            }
            if (typeof $scope.images_temp.image !== 'undefined')
            {
                $scope.item.image = $scope.images_temp.image;
            }
            if (typeof $scope.images_temp.images !== 'undefined')
            {
                $scope.item.images.splice(i, 0, $scope.images_temp.images);
            }
            if (typeof $scope.images_temp.cached_images !== 'undefined')
            {
                $scope.item.cached_images.splice(i, 0, $scope.images_temp.cached_images);
            }
            if (typeof $scope.images_temp.cached_image_thumbnails !== 'undefined')
            {
                $scope.item.cached_image_thumbnails.splice(i, 0, $scope.images_temp.cached_image_thumbnails);
            }
        };

        $scope.saveImage = function ()
        {
            delete $scope.images_temp;
            $scope.images_temp = {};
            if (typeof $scope.item.file !== 'undefined')
            {
                $scope.images_temp.file = $scope.item.file;
            }
            if (typeof $scope.item.image !== 'undefined')
            {
                $scope.images_temp.image = $scope.item.image;
            }
            if (typeof $scope.item.images !== 'undefined' && $scope.item.images.constructor === Array)
            {
                $scope.images_temp.images = [];
                for (i = 0; i < $scope.item.images.legth; i++)
                {
                    $scope.images_temp.images.push($scope.item.images[i]);
                }
            }
            if (typeof $scope.item.cached_images !== 'undefined' && $scope.item.cached_images.constructor === Array)
            {
                $scope.images_temp.cached_images = [];
                for (i = 0; i < $scope.item.cached_images.legth; i++)
                {
                    $scope.images_temp.cached_images.push($scope.item.cached_images[i]);
                }
            }
            if (typeof $scope.item.cached_image_thumbnails !== 'undefined' && $scope.item.cached_image_thumbnails.constructor === Array)
            {
                $scope.images_temp.cached_image_thumbnails = [];
                for (i = 0; i < $scope.item.cached_image_thumbnails.legth; i++)
                {
                    $scope.images_temp.cached_image_thumbnails.push($scope.item.cached_image_thumbnails[i]);
                }
            }
        };

        // Remove Image
        $scope.removeImage = function (i)
        {
            if (typeof $scope.item.file !== 'undefined')
            {
                delete $scope.item.file;
            }
            if (typeof $scope.item.image !== 'undefined')
            {
                delete $scope.item.image;
            }
            if (typeof $scope.item.images !== 'undefined' && $scope.item.images.constructor === Array && typeof $scope.item.images[i] !== 'undefined')
            {
                $scope.item.images.splice(i, 1);
            }
            if (typeof $scope.item.cached_images !== 'undefined' && $scope.item.cached_images.constructor === Array && typeof $scope.item.cached_images[i] !== 'undefined')
            {
                $scope.item.cached_images.splice(i, 1);
            }
            if (typeof $scope.item.cached_image_thumbnails !== 'undefined' && $scope.item.cached_image_thumbnails.constructor === Array && typeof $scope.item.cached_image_thumbnails[i] !== 'undefined')
            {
                $scope.item.cached_image_thumbnails.splice(i, 1);
            }
            $scope.uploaded = true;
        };

        $scope.checkpass = function ()
        {
            return $scope.item.password != $scope.item.passwordConfirm;
        };

        //Export excel
        $scope.exportData = function (id, filename)
        {
            var s = [];
            s.push("x");
            s.push("y");
            var blob = new Blob([s], {
                type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;charset=utf-8"
            });
            //console.dir(blob);
            saveAs(blob, filename);
        };

        // Search
        var timeoutCode;
        $scope.$watchCollection('search', function ()
        {
            clearTimeout(timeoutCode);
            timeoutCode = setTimeout(function () {
                if ($scope.search.q)
                {
                    if ($scope.search.q.length > 0)
                    {
                        $scope.previousSearch = true;
                        if ($scope.users.length < $rootScope.perpage)
                        {
                            // Just filtering
                        } else
                        {
                            // Do the Query
                            $scope.searchQuery();
                        }
                    }
                } else if ($scope.previousSearch)
                {
                    $scope.refresh();
                }
            }, 500);
        });

        $scope.searchQuery = function ()
        {
            user.list.get({
                limit: $scope.pages.per_page,
                page: $scope.pages.current_page,
                q: $scope.search.q
            },
                    function (response) // Success
                    {
                        $scope.status = "Success";
                        $scope.users = [];
                        var data = response.data;
                        for (var i in data)
                        {
                            $scope.users.push(data[i]);
                        }
                    },
                    function (response) // Error
                    {
                        $scope.status = "Error";
                        $rootScope.toaster(response.msg);
                    }
            );
        };

        $scope.validate = function ()
        {
            return true;
        };


        $scope.set_image = function ()
        {
            if ($scope.item.image !== 'undefined' || !$scope.item.image)
            {
                if (typeof $scope.item.images !== 'undefined' && $scope.item.images.constructor === Array && typeof $scope.item.images[0] !== 'undefined')
                    $scope.item.image = $scope.item.images[0];
            }
        }


        // Update
        $scope.update = function ()
        {
            if (!$scope.validate())
            {
                $translate('DASHBOARD.Validation error.').then(function (transalation) {
                    $scope.messages = {'status': 'error', 'message': transalation};
                    $rootScope.toaster($scope.messages);
                });
            } else
            {
                if (typeof $scope.item._id === 'object')
                {
                    $scope.item._id = $scope.item._id.$id;
                }

                //$scope.set_image();
                user.update.update($scope.item,
                        function (response)  // Success
                        {
                            if (response.list)
                            {
                                $rootScope.users = response.list.data;
                            }
                            if (response.item)
                            {
                                $scope.item = response.item;
                                if ($scope.item._id == $rootScope.user._id)
                                {
                                    $rootScope.user = $scope.item;
                                }
                            }
                            $scope.refresh();
                            $rootScope.toaster(response);
                        },
                        function (response)  // Error
                        {
                            $scope.status = "Error";
                            $rootScope.toaster(response);
                        }
                );
            }
        };

        $scope.get_icon = function (user)
        {
//            var images=$scope.loadImages(user);
//            var path = $rootScope.baseurl;
//            var avatar = "";
//            if (images.length!=0)
//            {
//                avatar = images[0];
//            }
//            else
//            {
//                avatar= path+'/assets/img/no_image_user.png';
//            }
//            return avatar;

            var path = $rootScope.baseurl;//"http://local.tagnifuse.com";
            var avatar = "";

            if (typeof user.image !== 'undefined' && user.image != null)
            {
                if (user.image.constructor === Array && typeof user.image[0] !== 'undefined')
                {
                    avatar = path + user.image[0];
                } else if (user.image.constructor !== Array)
                {
                    avatar = path + user.image;
                }
            } else if (typeof user.cached_image_thumbnails !== 'undefined' && typeof user.cached_image_thumbnails[0] !== 'undefined')
            {
                avatar = user.cached_image_thumbnails[0];
            } else
            {
                avatar = path + '/assets/img/no_image_user.png';
            }
            return avatar;
        };

        //Add all images to images array
        $scope.loadImages = function (user)
        {
            var images = [];
            var avatar = {};
            $scope.return_value_with_check(user.cached_image, images);
            $scope.return_value_with_check(user.cached_image_thumbnails, images);
            $scope.return_value_with_check(user.image, images);
            $scope.return_value_with_check(user.images, images);
            return images;
        };

        $scope.return_value_with_check = function (item, answer)
        {
            if (answer.length === 0)
            {
                var path = $rootScope.baseurl;

                var pattern = /^(https?:\/\/)?((([a-z\d]([a-z\d-]*[a-z\d])*)\.)+[a-z]{2,}|((\d{1,3}\.){3}\d{1,3}))(\:\d+)?(\/[-a-z\d%_.~+]*)*(\?[;&a-z\d%_.~+=-]*)?(\#[-a-z\d_]*)?$/i;

                if (typeof item !== 'undefined' && item)
                {
                    if (item.constructor === Array && typeof item[0] !== 'undefined' && item[0])
                    {
                        answer.push(item[0]);
                    } else if (item.constructor !== Array && item)
                    {
                        answer.push(item);
                    }
                    if (answer[0] !== 'undefined')
                    {
                        if (!pattern.test(answer[0]))
                        {
                            answer[0] = path + answer[0];
                        }
                    }
                }
                return typeof answer[0] !== 'undefined';
            }
        };

        /**
         * Toggle selected status of the contact
         *
         * @param contact
         * @param event
         */
        $scope.generateFunc = function ($scope, $log)
        {
            //var chars = "abcdefghijklmnopqrstuvwxyz!@#$%^&*()-+<>ABCDEFGHIJKLMNOP1234567890";
            //var pass = "";
            //for (var x = 0; x < 10; x++) {
            //var i = Math.floor(Math.random() * chars.10);
            //pass += chars.charAt(i);
            //}
            //$scope.PasswordGenerator = "aaaaaa";

            //$scope.PasswordGenerator= Math.random().toString(36).slice(-8);;
        };


        $scope.favorits = function (list, item, type)
        {
            return true;
            if (type)
            {
                console.dir(list);
                console.dir(item);
                console.dir(type);
                if (list.length > 0 && item)
                {
                    if (type == 'starred')
                    {
                        if (list.includes(item))
                        {
                            return true;
                        }
                    }
                }
                return false;
            } else
            {
                return true;
            }
        };

        $scope.addFavorits = function (user)
        {
            if ($rootScope.user.favorits)
            {
                if ($rootScope.user.favorits.includes(user._id.$id))
                {
                    // decide what TODO if is there   
                } else
                {
                    $rootScope.user.favorits.push(user._id.$id);
                }
            } else
            {
                $rootScope.user.favorits = [];
                $rootScope.user.favorits.push(user._id.$id);
            }

            //Call API to save favorites
        };

        // Refresh
        $scope.refresh = function ()
        {
            $scope.init();
            if ($scope.mode == 'list')
            {
                $scope.list();
            }
            if (!$scope.$$phase) {
                $scope.$apply();
            }
        };

        $scope.refresh();
    }

})();