type Props = {
  nombre: string
  cargo: string
  imagen: string
}

export default function StaffCard({ nombre, cargo, imagen }: Props) {
  return (
    <div className="relative rounded-tl-[100px] rounded-br-[100px] overflow-hidden shadow-lg bg-primary-dark">
      <img
        src={imagen}
        alt={nombre}
        className="w-full h-[400px] object-cover flex items-center justify-center text-white font-bold text-2xl"
      />
      <div className="h-full absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-6 justify-end flex flex-col">
        <h3 className="text-2xl font-semibold text-white">{nombre}</h3>
        <p className="text-lg text-white">{cargo}</p>
      </div>
    </div>
  )
}