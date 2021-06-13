import * as rt from 'runtypes';
import { buildCall } from 'typical-fetch';

function pickQueryValues<T extends Record<string, unknown>, K extends keyof T>(
  subject: T,
  ...keys: K[]
): [key: string, val: string][] {
  return keys
    .map((key) => [key, subject[key]])
    .filter(([, val]) => val !== undefined)
    .map(([key, val]) => [key.toString(), val.toString()]);
}

function pickFromObject<T extends Record<string, unknown>, K extends keyof T>(
  subject: T,
  ...keys: K[]
): Pick<T, K> {
  const pairs = keys
    .map((key) => [key, subject[key]])
    .filter(([, val]) => val !== undefined)
    .map(([key, val]) => [key, val]);
  return Object.fromEntries(pairs);
}

function withRuntype<T>(validator: rt.Runtype<T>) {
  return (data: unknown) => {
    return validator.check(data);
  };
}

const apiResponseRt = rt
  .Record({ code: rt.Number, type: rt.String, message: rt.String })
  .asPartial();

type ApiResponse = rt.Static<typeof apiResponseRt>;

const categoryRt = rt.Record({ id: rt.Number, name: rt.String }).asPartial();

type Category = rt.Static<typeof categoryRt>;

const tagRt = rt.Record({ id: rt.Number, name: rt.String }).asPartial();

type Tag = rt.Static<typeof tagRt>;

const petRt = rt
  .Record({
    id: rt.Number,
    category: categoryRt,
    name: rt.String,
    photoUrls: rt.Array(rt.String),
    tags: rt.Array(tagRt),
    status: rt.Union(
      rt.Literal('available'),
      rt.Literal('pending'),
      rt.Literal('sold'),
    ),
  })
  .asPartial();

type Pet = rt.Static<typeof petRt>;

const orderRt = rt
  .Record({
    id: rt.Number,
    petId: rt.Number,
    quantity: rt.Number,
    shipDate: rt.String,
    status: rt.Union(
      rt.Literal('placed'),
      rt.Literal('approved'),
      rt.Literal('delivered'),
    ),
    complete: rt.Boolean,
  })
  .asPartial();

type Order = rt.Static<typeof orderRt>;

const userRt = rt
  .Record({
    id: rt.Number,
    username: rt.String,
    firstName: rt.String,
    lastName: rt.String,
    email: rt.String,
    password: rt.String,
    phone: rt.String,
    userStatus: rt.Number,
  })
  .asPartial();

type User = rt.Static<typeof userRt>;

// Operation: uploadFile

const uploadFileArgsRt = rt.Intersect(
  rt.Record({ petId: rt.Number }).asReadonly(),
  rt
    .Record({ additionalMetadata: rt.String, file: rt.Unknown })
    .asPartial()
    .asReadonly(),
);

/**
 * operation ID: uploadFile
 * `POST: /pet/{petId}/uploadImage`
 */
export const uploadFile = buildCall() //
  .args<rt.Static<typeof uploadFileArgsRt>>()
  .method('post')
  .path((args) => `/pet/${args.petId}/uploadImage`)
  .parseJson(withRuntype(apiResponseRt))
  .build();

// Operation: updatePet

const updatePetArgsRt = rt.Record({ body: petRt }).asReadonly();

/**
 * operation ID: updatePet
 * `PUT: /pet`
 */
export const updatePet = buildCall() //
  .args<rt.Static<typeof updatePetArgsRt>>()
  .method('put')
  .path('/pet')
  .body((args) => args.body)
  .build();

// Operation: addPet

const addPetArgsRt = rt.Record({ body: petRt }).asReadonly();

/**
 * operation ID: addPet
 * `POST: /pet`
 */
export const addPet = buildCall() //
  .args<rt.Static<typeof addPetArgsRt>>()
  .method('post')
  .path('/pet')
  .body((args) => args.body)
  .build();

// Operation: findPetsByStatus

const findPetsByStatusArgsRt = rt
  .Record({
    status: rt.Array(
      rt.Union(
        rt.Literal('available'),
        rt.Literal('pending'),
        rt.Literal('sold'),
      ),
    ),
  })
  .asReadonly();

const findPetsByStatusResponseBodyRt = rt.Array(petRt);

/**
 * operation ID: findPetsByStatus
 * `GET: /pet/findByStatus`
 * Multiple status values can be provided with comma separated
 * strings
 */
export const findPetsByStatus = buildCall() //
  .args<rt.Static<typeof findPetsByStatusArgsRt>>()
  .method('get')
  .path('/pet/findByStatus')
  .query((args) => new URLSearchParams(pickQueryValues(args, 'status')))
  .parseJson(withRuntype(findPetsByStatusResponseBodyRt))
  .build();

// Operation: findPetsByTags

const findPetsByTagsArgsRt = rt
  .Record({ tags: rt.Array(rt.String) })
  .asReadonly();

const findPetsByTagsResponseBodyRt = rt.Array(petRt);

/**
 * operation ID: findPetsByTags
 * `GET: /pet/findByTags`
 * Multiple tags can be provided with comma separated strings.
 * Use tag1, tag2, tag3 for testing.
 */
export const findPetsByTags = buildCall() //
  .args<rt.Static<typeof findPetsByTagsArgsRt>>()
  .method('get')
  .path('/pet/findByTags')
  .query((args) => new URLSearchParams(pickQueryValues(args, 'tags')))
  .parseJson(withRuntype(findPetsByTagsResponseBodyRt))
  .build();

// Operation: getPetById

const getPetByIdArgsRt = rt.Record({ petId: rt.Number }).asReadonly();

/**
 * operation ID: getPetById
 * `GET: /pet/{petId}`
 * Returns a single pet
 */
export const getPetById = buildCall() //
  .args<rt.Static<typeof getPetByIdArgsRt>>()
  .method('get')
  .path((args) => `/pet/${args.petId}`)
  .parseJson(withRuntype(petRt))
  .build();

// Operation: updatePetWithForm

const updatePetWithFormArgsRt = rt.Intersect(
  rt.Record({ petId: rt.Number }).asReadonly(),
  rt.Record({ name: rt.String, status: rt.String }).asPartial().asReadonly(),
);

/**
 * operation ID: updatePetWithForm
 * `POST: /pet/{petId}`
 */
export const updatePetWithForm = buildCall() //
  .args<rt.Static<typeof updatePetWithFormArgsRt>>()
  .method('post')
  .path((args) => `/pet/${args.petId}`)
  .build();

// Operation: deletePet

const deletePetArgsRt = rt.Intersect(
  rt.Record({ petId: rt.Number }).asReadonly(),
  rt.Record({ api_key: rt.String }).asPartial().asReadonly(),
);

/**
 * operation ID: deletePet
 * `DELETE: /pet/{petId}`
 */
export const deletePet = buildCall() //
  .args<rt.Static<typeof deletePetArgsRt>>()
  .method('delete')
  .path((args) => `/pet/${args.petId}`)
  .build();

// Operation: getInventory

const getInventoryResponseBodyRt = rt.Dictionary(rt.Unknown);

/**
 * operation ID: getInventory
 * `GET: /store/inventory`
 * Returns a map of status codes to quantities
 */
export const getInventory = buildCall() //
  .method('get')
  .path('/store/inventory')
  .parseJson(withRuntype(getInventoryResponseBodyRt))
  .build();

// Operation: placeOrder

const placeOrderArgsRt = rt.Record({ body: orderRt }).asReadonly();

/**
 * operation ID: placeOrder
 * `POST: /store/order`
 */
export const placeOrder = buildCall() //
  .args<rt.Static<typeof placeOrderArgsRt>>()
  .method('post')
  .path('/store/order')
  .body((args) => args.body)
  .parseJson(withRuntype(orderRt))
  .build();

// Operation: getOrderById

const getOrderByIdArgsRt = rt.Record({ orderId: rt.Number }).asReadonly();

/**
 * operation ID: getOrderById
 * `GET: /store/order/{orderId}`
 * For valid response try integer IDs with value >= 1 and <=
 * 10. Other values will generated exceptions
 */
export const getOrderById = buildCall() //
  .args<rt.Static<typeof getOrderByIdArgsRt>>()
  .method('get')
  .path((args) => `/store/order/${args.orderId}`)
  .parseJson(withRuntype(orderRt))
  .build();

// Operation: deleteOrder

const deleteOrderArgsRt = rt.Record({ orderId: rt.Number }).asReadonly();

/**
 * operation ID: deleteOrder
 * `DELETE: /store/order/{orderId}`
 * For valid response try integer IDs with positive integer
 * value. Negative or non-integer values will generate API
 * errors
 */
export const deleteOrder = buildCall() //
  .args<rt.Static<typeof deleteOrderArgsRt>>()
  .method('delete')
  .path((args) => `/store/order/${args.orderId}`)
  .build();

// Operation: createUsersWithListInput

const createUsersWithListInputArgsRt = rt
  .Record({ body: rt.Array(userRt) })
  .asReadonly();

/**
 * operation ID: createUsersWithListInput
 * `POST: /user/createWithList`
 */
export const createUsersWithListInput = buildCall() //
  .args<rt.Static<typeof createUsersWithListInputArgsRt>>()
  .method('post')
  .path('/user/createWithList')
  .body((args) => args.body)
  .build();

// Operation: getUserByName

const getUserByNameArgsRt = rt.Record({ username: rt.String }).asReadonly();

/**
 * operation ID: getUserByName
 * `GET: /user/{username}`
 */
export const getUserByName = buildCall() //
  .args<rt.Static<typeof getUserByNameArgsRt>>()
  .method('get')
  .path((args) => `/user/${args.username}`)
  .parseJson(withRuntype(userRt))
  .build();

// Operation: updateUser

const updateUserArgsRt = rt
  .Record({ username: rt.String, body: userRt })
  .asReadonly();

/**
 * operation ID: updateUser
 * `PUT: /user/{username}`
 * This can only be done by the logged in user.
 */
export const updateUser = buildCall() //
  .args<rt.Static<typeof updateUserArgsRt>>()
  .method('put')
  .path((args) => `/user/${args.username}`)
  .body((args) => args.body)
  .build();

// Operation: deleteUser

const deleteUserArgsRt = rt.Record({ username: rt.String }).asReadonly();

/**
 * operation ID: deleteUser
 * `DELETE: /user/{username}`
 * This can only be done by the logged in user.
 */
export const deleteUser = buildCall() //
  .args<rt.Static<typeof deleteUserArgsRt>>()
  .method('delete')
  .path((args) => `/user/${args.username}`)
  .build();

// Operation: loginUser

const loginUserArgsRt = rt
  .Record({ username: rt.String, password: rt.String })
  .asReadonly();

const loginUserResponseBodyRt = rt.String;

/**
 * operation ID: loginUser
 * `GET: /user/login`
 */
export const loginUser = buildCall() //
  .args<rt.Static<typeof loginUserArgsRt>>()
  .method('get')
  .path('/user/login')
  .query(
    (args) =>
      new URLSearchParams(pickQueryValues(args, 'username', 'password')),
  )
  .parseJson(withRuntype(loginUserResponseBodyRt))
  .build();

// Operation: logoutUser

/**
 * operation ID: logoutUser
 * `GET: /user/logout`
 */
export const logoutUser = buildCall() //
  .method('get')
  .path('/user/logout')
  .build();

// Operation: createUsersWithArrayInput

const createUsersWithArrayInputArgsRt = rt
  .Record({ body: rt.Array(userRt) })
  .asReadonly();

/**
 * operation ID: createUsersWithArrayInput
 * `POST: /user/createWithArray`
 */
export const createUsersWithArrayInput = buildCall() //
  .args<rt.Static<typeof createUsersWithArrayInputArgsRt>>()
  .method('post')
  .path('/user/createWithArray')
  .body((args) => args.body)
  .build();

// Operation: createUser

const createUserArgsRt = rt.Record({ body: userRt }).asReadonly();

/**
 * operation ID: createUser
 * `POST: /user`
 * This can only be done by the logged in user.
 */
export const createUser = buildCall() //
  .args<rt.Static<typeof createUserArgsRt>>()
  .method('post')
  .path('/user')
  .body((args) => args.body)
  .build();
