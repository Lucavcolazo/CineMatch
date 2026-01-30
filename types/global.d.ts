import { Object3DNode, MaterialNode } from '@react-three/fiber';
import { MeshLineGeometry as MeshLineGeometryImpl, MeshLineMaterial as MeshLineMaterialImpl } from 'meshline';

declare module '*.glb';
declare module '*.png';

declare module '@react-three/fiber' {
    interface ThreeElements {
        meshLineGeometry: Object3DNode<MeshLineGeometryImpl, typeof MeshLineGeometryImpl>;
        meshLineMaterial: MaterialNode<MeshLineMaterialImpl, typeof MeshLineMaterialImpl>;
    }
}
