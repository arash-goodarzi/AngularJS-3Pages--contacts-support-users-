(function ()
{
    'use strict';

    angular
            .module('app.tagnitro.users.activeusers')
            .controller('ActiveusersController', ActiveusersController);

    /** @ngInject */
    function ActiveusersController($rootScope, $scope, api, $mdToast, $translate, FileUploader, Upload, $mdDialog)
    {
        var vm = this;
        vm.num = 0;

        var user = api.user;

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
            } else if ($rootScope.pusherlist['users'])
            {
                for (var i in $rootScope.pusherlist['users'])
                {
                    $scope.users.push($rootScope.pusherlist['users'][i]);
                }
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
                            //console.log($scope.users);

                            $rootScope.users = $scope.users;
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
            $scope.item.role = ($scope.item.group_ids[0] && $scope.item.group_ids[0] == '560ea9c686597bea7202c847') ? 'moderator' : 'operator';
            $scope.mode = 'edit';
            $scope.item.first_name = item.first_name;
            $scope.item.last_name = item.last_name;
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
                    // Upload path
                    var upload_path = '/upload-api/' + (($file.type.indexOf('image') !== -1) ? 'image' : 'document');

                    $scope.upload = Upload.upload({
                        url: $rootScope.baseurl + upload_path,
                        data: {item: $scope.item.id, file: $file, method: 'post'}

                    })
                            .progress(function (evt) {
                                console.log('percent: ' + parseInt(100.0 * evt.loaded / evt.total));
                            })
                            .success(function (data, status, headers, config) {
                                if (data !== "")
                                {
                                    if (typeof $scope.item.images === 'undefined')
                                    {
                                        $scope.item.images = [];
                                    }
                                    if (typeof $scope.item.cached_images === 'undefined')
                                    {
                                        $scope.item.cached_images = [];
                                    }
                                    if (typeof $scope.item.cached_image_thumbnails === 'undefined')
                                    {
                                        $scope.item.cached_image_thumbnails = [];
                                    }
                                    $scope.item.images.push(data.image.path);
                                    $scope.item.cached_images.push(data.cached_image);
                                    $scope.item.cached_image_thumbnails.push($rootScope.baseurl + data.cached_image_thumbnail);
                                    $scope.uploaded = false;
                                }
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
                        if (! pattern.test(answer[0]))
                        {
                            answer[0] = path+answer[0];
                        }
                    }
                }
                return typeof answer[0] !== 'undefined';
            }
        };

    }



})();

