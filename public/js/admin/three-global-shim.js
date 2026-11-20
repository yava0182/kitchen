/**
 * ES-module shim: отдаёт уже загруженный window.THREE (vendor/three150/three.min.js).
 * Нужен, чтобы GLTFLoader (jsm) не тянул вторую копию three.module.js.
 */
const THREE = globalThis.THREE;
if (!THREE) {
  throw new Error('[CLD] three-global-shim: window.THREE ещё не загружен (подключите three.min.js раньше importmap)');
}

export default THREE;

export const AnimationClip = THREE.AnimationClip;
export const Bone = THREE.Bone;
export const Box3 = THREE.Box3;
export const BufferAttribute = THREE.BufferAttribute;
export const BufferGeometry = THREE.BufferGeometry;
export const ClampToEdgeWrapping = THREE.ClampToEdgeWrapping;
export const Color = THREE.Color;
export const DirectionalLight = THREE.DirectionalLight;
export const DoubleSide = THREE.DoubleSide;
export const FileLoader = THREE.FileLoader;
export const FrontSide = THREE.FrontSide;
export const Group = THREE.Group;
export const ImageBitmapLoader = THREE.ImageBitmapLoader;
export const InstancedMesh = THREE.InstancedMesh;
export const InterleavedBuffer = THREE.InterleavedBuffer;
export const InterleavedBufferAttribute = THREE.InterleavedBufferAttribute;
export const Interpolant = THREE.Interpolant;
export const InterpolateDiscrete = THREE.InterpolateDiscrete;
export const InterpolateLinear = THREE.InterpolateLinear;
export const Line = THREE.Line;
export const LineBasicMaterial = THREE.LineBasicMaterial;
export const LineLoop = THREE.LineLoop;
export const LineSegments = THREE.LineSegments;
export const LinearFilter = THREE.LinearFilter;
export const LinearMipmapLinearFilter = THREE.LinearMipmapLinearFilter;
export const LinearMipmapNearestFilter = THREE.LinearMipmapNearestFilter;
export const Loader = THREE.Loader;
export const LoaderUtils = THREE.LoaderUtils;
export const Material = THREE.Material;
export const MathUtils = THREE.MathUtils;
export const Matrix4 = THREE.Matrix4;
export const Mesh = THREE.Mesh;
export const MeshBasicMaterial = THREE.MeshBasicMaterial;
export const MeshPhysicalMaterial = THREE.MeshPhysicalMaterial;
export const MeshStandardMaterial = THREE.MeshStandardMaterial;
export const MirroredRepeatWrapping = THREE.MirroredRepeatWrapping;
export const NearestFilter = THREE.NearestFilter;
export const NearestMipmapLinearFilter = THREE.NearestMipmapLinearFilter;
export const NearestMipmapNearestFilter = THREE.NearestMipmapNearestFilter;
export const NumberKeyframeTrack = THREE.NumberKeyframeTrack;
export const Object3D = THREE.Object3D;
export const OrthographicCamera = THREE.OrthographicCamera;
export const PerspectiveCamera = THREE.PerspectiveCamera;
export const PointLight = THREE.PointLight;
export const Points = THREE.Points;
export const PointsMaterial = THREE.PointsMaterial;
export const PropertyBinding = THREE.PropertyBinding;
export const Quaternion = THREE.Quaternion;
export const QuaternionKeyframeTrack = THREE.QuaternionKeyframeTrack;
export const RepeatWrapping = THREE.RepeatWrapping;
export const Skeleton = THREE.Skeleton;
export const SkinnedMesh = THREE.SkinnedMesh;
export const Sphere = THREE.Sphere;
export const SpotLight = THREE.SpotLight;
export const Texture = THREE.Texture;
export const TextureLoader = THREE.TextureLoader;
export const TriangleFanDrawMode = THREE.TriangleFanDrawMode;
export const TriangleStripDrawMode = THREE.TriangleStripDrawMode;
export const Vector2 = THREE.Vector2;
export const Vector3 = THREE.Vector3;
export const VectorKeyframeTrack = THREE.VectorKeyframeTrack;
export const sRGBEncoding = THREE.sRGBEncoding;
